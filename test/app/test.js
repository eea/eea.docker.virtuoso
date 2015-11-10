#!/usr/bin/env node
/*
 * The script saves in a csv file the labels, number of fields, fields name 
 * and number of rows from MAIN_QUERY and MAIN_QUERY_2 responses.
 * It saves all bookmarked queries in a list and executes them twice;
 * First time it modifies each SPARQL query for getting the number of rows and
 * second time, it modifies them to save the columns.
 * 
 */
var sparqlClient = require('sparql-client');
var async = require('async');
var stringify = require('csv-stringify');

var args = process.argv.slice(2);

var _endpoint = '';
var _filename = '';

var DEBUG = false; // set true for debugging 

var problems = [
    "Simple SPARQL query on demo_gind",
    "SPARQL query on nrg_101a with joins on dictionaries",
    "SPARQL query on namq_aux_pem with joins on dictionaries",
    "Simple SPARQL query on tsdtr310"
    ];

var MAIN_QUERY = 'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
	      PREFIX cr: <http://cr.eionet.europa.eu/ontologies/contreg.rdf#> \
	      \
	      SELECT ?label, ?query \
	      WHERE {\
		?bookmark a cr:SparqlBookmark ;\
			  rdfs:label ?label ;\
			  cr:sparqlQuery ?query \
	      } LIMIT 150'; // LIMIT 150

var MAIN_QUERY_2 = 'PREFIX pt: <http://www.eea.europa.eu/portal_types/Sparql#> \
	      PREFIX dct: <http://purl.org/dc/terms/> \
	      \
	      SELECT (?title as ?label) ?query \
	      WHERE { \
		?type a pt:Sparql; \
		pt:sparql_query ?query; \
		pt:endpoint_url ?endpoint; \
		dct:title ?title \
		FILTER regex(?endpoint, "semantic.eea.europa.eu") \
	      } LIMIT 100'; // LIMIT 100

var all_queries = []; // all queries resulted from main query
var query_labels = {};
var query_counts = {};

var delimiter = ',';
var stringifier = stringify({ delimiter: delimiter });


var init = function () {
  // Initialize endpoint and output file name

  if (args.length != 2 || args[0].indexOf('http://') !== 0) {
    throw new Error('Insert the correct arguments ! The script execution will stop.');
  }
  
  _endpoint = args[0];  // "http://semantic.eea.europa.eu/sparql"; // 
  _filename = args[1];  // "query_results"; // 
};


var call_server = function(query, endpoint, onsuccess, onerror) {
  // Calls the server and after the response is arrived it triggers onsuccess or onerror
  
  var client = new sparqlClient(endpoint, {});
  var callback = function(errors, results){
      if (errors) {
        return onerror(errors);
      }
      return onsuccess(results);
  };
  client.query(query).execute(callback);
};


var make_all_queries = function(response) {
  // Parse the response of MAIN_QUERY execution
  var res = response.results.bindings;
  var heads = response.head.vars;

  for (var i = 0; i < res.length; i++){
    var queryItem = {};
    for (var j = 0; j < heads.length; j++){

      if (res[i][heads[j]] !== undefined){
	queryItem[heads[j]] = res[i][heads[j]].value;  
      }
    }
    all_queries.push(queryItem);
  }
};


var make_all_queries_1 = function(response) {
  // Populates all_queries array from MAIN_QUERY
  make_all_queries(response);
  main_query_2();
}


var make_all_queries_2 = function(response) {
  // Populates all_queries array from MAIN_QUERY_2
  make_all_queries(response);
  process_all_queries_step_1();
}


var get_filtered_queries = function(){
  // useful in debugging, only process a limited set of queries
  
  var res = [];
  for (var i = 0; i<all_queries.length;i++){
    var q = all_queries[i];
    if (problems.indexOf(q.label) > -1) {
	res.push(q);
    }
  }
  return res;
}; 


var process_all_queries_step_1 = function() {
    // Process each query for saving number of rows
  var filtered;
  if (DEBUG) {
    filtered = get_filtered_queries();
    
  } else {
    filtered = all_queries;
  } 
  
  async.eachSeries(filtered, get_query_counts, process_all_queries_step_2);
};


var process_all_queries_step_2 = function(err) {
  // Process each query for saving columns
  var filtered;
  if (DEBUG) {
    filtered = get_filtered_queries();
    
  } else {
    filtered = all_queries;
  } 
  
  async.eachSeries(filtered, get_query_labels, save_to_csv);
};


var modify_query_rows = function(query) {
  // Modifies the query for returning number of rows
  var retSelect;
  
  if (query.indexOf('LIMIT') > -1) {
    retSelect = query.slice(0, query.indexOf('LIMIT'));
    retSelect = [retSelect.slice(0, retSelect.indexOf('SELECT')), 
		   'SELECT count(*) as ?nrOfRows where {{', 
		   retSelect.slice(retSelect.indexOf('SELECT'))].join(' ');
    retSelect += ' }}';
    
    return retSelect;
  }
  
  retSelect = [query.slice(0, query.indexOf('SELECT')), 
		 'SELECT count(*) as ?nrOfRows where {{', 
		 query.slice(query.indexOf('SELECT'))].join(' ');
  retSelect += ' }}';
  
  return retSelect;
};


var get_query_counts = function(item, callback) {
  // Executes modified query and saves number of rows
  /*
  if (item.label !== problem) {
      // console.log("Skipping query");
      return callback();
  }
  */
  var result_query = modify_query_rows(item.query);

  call_server(
    result_query, 
    _endpoint, 
    
    function(response){ 
      console.log("Processing query:", all_queries.indexOf(item) + 1, item.label);
      save_query_counts(item.query, response); 
      return callback();
    },
    
    function(errors){
      console.log('Processing query:', all_queries.indexOf(item) + 1, errors.toString());
      query_counts[item.query] = errors.toString();
      return callback();
    }
  );
};


var modify_query_for_columns = function(query) {
  // Modifies the query for returning the columns
  var retSelect = query;
  
  retSelect = [query.slice(0, query.indexOf('SELECT')), 
		 'SELECT * where {{', 
		 query.slice(query.indexOf('SELECT'))].join(' '); 
  retSelect += ' }} LIMIT 1';
  // console.log(retSelect);
  return retSelect;
};


var get_query_labels = function(item, callback) {
  // Executes modified query and saves columns 
  /*
  if (item.label !== problem) {
      // console.log("Skipping query");
      return callback();
  }
  */
  var result_query = modify_query_for_columns(item.query);
  
  call_server(
    result_query, 
    _endpoint, 
    
    function(response){ 
      console.log('Processing query:', all_queries.indexOf(item) + 1, item.label);
      save_query_label(item.query, response);
      return callback();
    },
    
    function(errors){
      console.log('Processing query:', all_queries.indexOf(item) + 1, errors.toString());
      query_labels[item.query] = [errors.toString()];
      return callback();
    }
  );
};


var save_query_counts = function(query, response) {
  // Saves the number of rows from parsed response

  if (!response || !response.results.bindings || response.results.bindings.length === 0) {
    query_counts[query] = 0;
    
  } else {
    query_counts[query] = response.results.bindings[0].nrOfRows.value;
  }
};


var save_query_label = function(query, response) {
  // Saves the columns from parsed response

  if (!response || !response.results.bindings || response.results.bindings.length === 0) {  
    query_labels[query] = ['Error: The server return no columns'];
    
  } else {
    var sortedColumns = Object.keys(response.results.bindings[0]).sort();
    query_labels[query] = sortedColumns;
  }
};


var save_to_csv = function(error) {
  // Saves the all the results in csv_rows
  var csv_rows = [];
  var header = [];
  header.push('-');
  header.push('Label');
  header.push('Nr of Columns');
  header.push('Columns names');
  header.push('Nr of rows');

  csv_rows.push(stringifier.stringify(header) + '\n');
  
  var bookmark_names = {};
  
  for (var i = 0; i < all_queries.length; i++) {
    var label = all_queries[i].label;
    var query = all_queries[i].query;
    
    bookmark_names[query] = label;
  }
  
  for (var name in query_counts) {
    var nrRows = (query_labels[name][0].indexOf('Error') > -1) ? 0 : query_labels[name].length;
    var columns = (query_labels[name] || []).join('; ');
    var row = [bookmark_names[name], nrRows, columns, query_counts[name]];
    csv_rows.push(stringifier.stringify(row) + '\n');
  }
  
  save_csv_file(csv_rows);
};


var save_csv_file = function(csv_rows) {
  // Saves the csv_rows in file
  var fs = require('fs');
  
  fs.writeFile(_filename, csv_rows, function (err, data) {
    if (err) {
      return console.log(err);
    }
    console.log('\nResults succesfully saved !');
  });
};


var main_query_2 = function() {
  // 
  call_server(MAIN_QUERY_2, _endpoint, make_all_queries_2, function(errors){
    console.log('Errors for main query 2');
  });
}


init();
call_server(MAIN_QUERY, _endpoint, make_all_queries_1, function(errors){
    console.log('Errors for main query');
});