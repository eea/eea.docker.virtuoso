#!/usr/bin/env node

var sparqlClient = require('sparql-client');
var async = require('async');
var stringify = require('csv-stringify');

var args = process.argv.slice(2);

var _endpoint = '';
var _filename = '';

var MAIN_QUERY = 'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
	      PREFIX cr: <http://cr.eionet.europa.eu/ontologies/contreg.rdf#> \
	      \
	      SELECT ?label, ?query \
	      WHERE {\
		?bookmark a cr:SparqlBookmark ;\
			  rdfs:label ?label ;\
			  cr:sparqlQuery ?query \
	      } LIMIT 115';

var all_queries = []; // all queries resulted from main query
var query_labels = {};
var query_counts = {};

var delimiter = ',';
var stringifier = stringify({ delimiter: delimiter });


var init = function () {
  // Initialize endpoint and output file name
  if (args.length != 2 || args[0].indexOf('http://') != 0) {
    
    throw new Error('Insert the correct arguments ! The script execution will stop.');
  }
  
  _endpoint = args[0];  // "http://semantic.eea.europa.eu/sparql"; // 
  _filename = args[1];  // "query_results"; // 
}


var call_server = function (query, endpoint, callbackfunction) {
  // Calls the server and after the response is arrived it triggers callbackfunction
  
  var client = new sparqlClient(endpoint);
  client.query(query).execute(function(error, response) {
    callbackfunction(error, response);
  });
};


var make_all_queries = function(error, response) {
  
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
  
  process_all_queries_step_1();
}


var process_all_queries_step_1 = function() {
  async.each(all_queries, get_query_counts, process_all_queries_step_2);
}


var process_all_queries_step_2 = function(err) {
  async.each(all_queries, get_query_labels, save_to_csv);
}


var get_query_counts = function(item, callback) {
  //
  var result_query = modify_query_rows(item.query);
  call_server(
    result_query, 
    _endpoint, 
    function(error, response){ 
      console.log("Processing query:", all_queries.indexOf(item) + 1, item.label);
      save_query_counts(item.query, error, response); 
      callback();
    }
  );
}


var modify_query_rows = function(query) {
  // 
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
}


var get_query_labels = function(item, callback) {
  //console.log(item);
  var result_query = modify_query_for_columns(item.query);
  
  //console.log(result_query);
  call_server(
    result_query, 
    _endpoint, 
    function(error, response){ 
      console.log("Processing query:", all_queries.indexOf(item) + 1, item.label);
      save_query_label(item.query, error, response);
      callback();
    }
  );
}


var modify_query_for_columns = function(query) {
  var retSelect = query;
  
  if ( retSelect.indexOf('LIMIT') == -1) {
    retSelect += ' LIMIT 1';
  }
  return retSelect;
}


var save_query_counts = function(query, error, response) {
  // parse response
  if (!response || response.results.bindings.length == 0) {  
    query_counts[query] = [];
    
  } else {
    query_counts[query] = response.results.bindings[0].nrOfRows.value;
  }
  
}


var save_query_label = function(query, error, response) {
  // parse response
  if (!response || response.results.bindings.length == 0) {  
    query_labels[query] = [];
    
  } else {
    query_labels[query] = [];
    
    var nrOfRows = response.results.bindings.length;
    var sortedColumns = Object.keys(response.results.bindings[0]).sort();
    var nrOfCols = Object.keys(response.results.bindings[0]).length;
    
    query_labels[query].push(nrOfRows);
    query_labels[query].push(sortedColumns);
    query_labels[query].push(nrOfCols);
  }
  
}


var save_to_csv = function(error) {
  
  var csv_rows = [];
  var header = [];
  header.push('-');
  header.push('Label');
  //header.push('Nr of Columns');
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
    /*console.log('\n-------');
    console.log(bookmark_names[name]);
    console.log(query_counts[name]);*/
    
    var columns = (query_labels[name][1] || []).join(',');
    var row = [bookmark_names[name], columns, query_counts[name]];
    csv_rows.push(stringifier.stringify(row) + '\n');
    //console.log(columns);
  }
  
  save_csv_file(csv_rows);
}


var save_csv_file = function(csv_rows) {
  //console.log(csv_rows);
  var fs = require('fs');
  
  fs.writeFile(_filename, csv_rows, function (err, data) {
    if (err) {
      return console.log(err);
    }
      console.log('\nResults succesfully saved !');
  });
}


init();
call_server(MAIN_QUERY, _endpoint, make_all_queries);
