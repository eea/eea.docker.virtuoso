
var sparqlClient = require('sparql-client');
var async = require('async');
var stringify = require('csv-stringify');

var _endpoint = "http://semantic.eea.europa.eu/sparql";  //"http://cr.eionet.europa.eu/sparql";

var MAIN_QUERY = "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
	      PREFIX cr: <http://cr.eionet.europa.eu/ontologies/contreg.rdf#> \
	      \
	      SELECT ?label, ?query \
	      WHERE {\
		?bookmark a cr:SparqlBookmark ;\
			  rdfs:label ?label ;\
			  cr:sparqlQuery ?query \
	      } LIMIT 100";  // } LIMIT 50";

var all_queries = [];	// all queries resulted from main query
var all_results = [];	// all the results from making queries to each from all_queries
var csv_string_rows = []; // all the rows of the result for saving in csv

var delimiter = ',';  // 
var stringifier = stringify({ delimiter: delimiter });

var header = [];
header.push('-');
header.push('Label');
header.push('Nr of Columns');
header.push('Columns names');
header.push('Nr of rows');

csv_string_rows.push(stringifier.stringify(header) + '\n');


console.log(all_queries);   // this will be empty because server hasn't been called yet. 
                // nodejs is all async


var call_server = function (query, endpoint, callbackfunction) {
  // call the server and after the response is arrived it triggers callbackfunction
  // Params: query - holds the query string 
  //       endpoint - holds the URL endpoint string
  
    var client = new sparqlClient(endpoint);

    client.query(query).execute(function(error, results) {

	callbackfunction(error, results);
    });
};


var handle_main_query_results = function(error, results) {
  // Handler function for saving the MAIN_QUERY results in queryItem object and calls process_query
  //   for processing action
  // Params: error - holds server errors
  // 	   results - holds server response

  var res = results.results.bindings;
  var heads = results.head.vars;

  for (var i = 0; i < res.length; i++){
    
    var queryItem = {};
    for (var j = 0; j < heads.length; j++){

      if (res[i][heads[j]] !== undefined){
	queryItem[heads[j]] = res[i][heads[j]].value;  
      }
    }
    all_queries.push(queryItem);
  }

  process_query(0, all_queries[0].label);
  
  //console.log("Got queries: ", all_queries.length);
};


var handle_secondary_query_result = function(error, results) {
  // Handler function for saving the secondary queries results in all_results array for processing 
  //   action
  // Params: error - holds server errors
  // 	   results - holds server response

  var item = {};
  item.label = all_queries[all_results.length].label;
  
  if (!results) {  
    item.binds = 'error';
    
  } else {
    item.binds = results.results.bindings;
  }
  
  all_results.push(item);
  console.log(all_results.length);
  
  if (all_results.length >= all_queries.length) {
  
    process_query(all_results.length, '');
  } else {
  
    process_query(all_results.length, all_queries[all_results.length].label);
  }
};

var global_index;

var abc = function() { 
  call_server(all_queries[global_index].query, _endpoint, handle_secondary_query_result);
}

var process_query = function(index, label){
  // After calling all the queries responses, it parses the secondary results and saves them
  // Params: index - holds the index of result
  
  //console.log('all_results', index);
  if (index > all_queries.length - 1) {
    // all secondary queries are processed; now saving to csv
    // console.log("Processing query", index);
    console.log("All results length: ", all_results.length);
    
    parse_results(all_results);
    save_to_csv();
    return
  }
  console.log("Processing query", index, label);
  
  global_index = index;
  setTimeout(abc, 0);
  
};


var parse_results = function(items) {
  // Parse each results and after it calls
  // Params: items - holds the array of secondary results
  
  async.each(items, 
    function(item, callback){
      save_to_Array(item);
      callback();
    },
    function(err){
      var csv_string = stringifier.stringify(csv_string_rows);
      // console.log(csv_string_rows);
      console.log('Done parsing !');
    }
  );
};


var save_to_Array = function(item){
  // Saves the item result in csv_string_rows array
  
  var row = [];
  var csv_row = '';
  
  if (item.binds === 'error' || item.binds.length <= 0) {

    row.push(item.label);
    row.push(0);
    row.push('-');
    row.push(0);
    
    csv_row = stringifier.stringify(row);
    csv_row += '\n';
    
    csv_string_rows.push(csv_row);
    
    return;
  }
  
  var label = item.label;
  var nrOfRows = item.binds.length;
  var sortedColumns = Object.keys(item.binds[0]).sort();
  var nrOfCols = Object.keys(item.binds[0]).length;
  
  sortedColumns = sortedColumns.join(';  ');
  
  row.push(label);
  row.push(nrOfCols);
  row.push(sortedColumns);
  row.push(nrOfRows);
  
  csv_row = stringifier.stringify(row);
  csv_row += '\n';
  
  csv_string_rows.push(csv_row);
  
};


var save_to_csv = function() {
  // Saves the csv_string_rows array in queryResults.csv file
  
  var fs = require('fs');
  
  fs.writeFile('./queryResults.csv', csv_string_rows, function (err, data) {
      if (err) {
	  return console.log(err);
      }
      console.log('Results succesfully saved !');
  });
};


call_server(MAIN_QUERY, _endpoint, handle_main_query_results);
