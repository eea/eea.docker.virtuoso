
var sparqlClient = require('sparql-client');
var async = require('async');
var _endpoint = "http://cr.eionet.europa.eu/sparql";  //"http://semantic.eea.europa.eu/sparql";

var MAIN_QUERY = "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
	      PREFIX cr: <http://cr.eionet.europa.eu/ontologies/contreg.rdf#> \
	      \
	      SELECT ?label, ?query \
	      WHERE {\
		?bookmark a cr:SparqlBookmark ;\
			  rdfs:label ?label ;\
			  cr:sparqlQuery ?query \
	      } LIMIT 4";

var all_queries = [];	// holds all queries resulted from main query
var all_results = [];	// holds all the results from making queries to each from all_queries
var csv_string_rows = ['Label, Nr of Columns, Columns names, Nr of rows \n'];

console.log(all_queries);	// this will be empty because server hasn't been called yet. nodejs is all async


var call_server = function (query, endpoint, callbackfunction) {
  
  var client = new sparqlClient(endpoint);

  client.query(query).execute(function(error, results){
    callbackfunction(error, results);
  });
};

var handle_main_query_results = function(error, results) {
  
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
  
//  for (var x =0; x<all_queries.length; x++) {
//    call_server((all_queries[x].query, _endpoint, handle_secondary_query_result);
//  }
  
  process_query(0);
  
  //console.log("Got queries: ", all_queries.length);
};

var handle_secondary_query_result = function(error, results) {
  
  /*var item = {};
  item['vars'] = res.head.vars;
  item['binds'] = results.results.bindings;*/
  
  all_results.push(results.results.bindings);
  //all_results.push(item);
  process_query(all_results.length);
};


var process_query = function(index){
  
  //console.log('all_results', index);
  if (index > all_queries.length - 1) {
    // all secondary queries are processed; now saving to csv
    // console.log("Processing query", index);
    console.log("All results length: ", all_results.length);
    
    parse_results(all_results);
    save_to_csv();
    return
  }
  console.log("Processing query", index);
  
  call_server(all_queries[index].query, _endpoint, handle_secondary_query_result);
};

var parse_results = function(items) {
  
  async.each(items, 
    function(item, callback){
      // var i=0; i++;
      //csv_rows.push(item[0]);
      item.saveToArray();
      
      callback();
    },
    function(err){
      console.log(csv_string_rows);
      console.log('done!');
    }
  );
};

Array.prototype.saveToArray = function(){
  
  var row = '';
  
  if (this.length <= 0) {
    //console.log("Query returned 0 rows.");
    row = ', 0, -, 0';
    csv_string_rows.push(row);
    return;
  }
  
  var nrOfRows = this.length;
  var sortedColumns = Object.keys(this[0]).sort();
  var nrOfCols = Object.keys(this[0]).length;
  
  row = ', ' + nrOfCols + ', "' + sortedColumns.join('; ') + '", ' + nrOfRows + ' \n';
  
  csv_string_rows.push(row);
  
};

var save_to_csv = function() {
  
  var fs = require('fs');
  
  fs.writeFile('/home/razvan/Work/queryResults.csv', csv_string_rows, function (err, data) {
      if (err) {
	  return console.log(err);
      }
      console.log('Results saved !');
  });
  
};

call_server(MAIN_QUERY, _endpoint, handle_main_query_results);







var execSparqlList = function () {
  
  for(var i = 0; i < _queryArray.length; i++){
    getSparqlResults(queryArray[i].query)
  }
}


var fetch_queries = function(endpoint, query, queryArray) {
    //var _queryArray = [];
    var sparqlClient = require('sparql-client');
    var fs = require('fs');
    var client = new sparqlClient(endpoint);

    client.query(query).execute(function(error, results){
        var csv_string = 'Label, Nr of Columns, Columns names, Nr of rows \n';
        var rows_str = '';
        //var queryArray = [];
        //var toindex = {};
        for (var i = 0; i < results.results.bindings.length; i++){
            var toindex = {};
            for (var j = 0; j < results.head.vars.length; j++){
                if (results.results.bindings[i][results.head.vars[j]] !== undefined){
		    toindex[results.head.vars[j]] = results.results.bindings[i][results.head.vars[j]].value;
		    //queryArray.push(toindex);
                    //rows_str += results.head.vars[j] + ' : ' + results.results.bindings[i][results.head.vars[j]].value;
                    //rows_str += "\n =========== \n";
                }
            }
            queryArray.push(toindex);
	    //rows_str += "\n";
            //rows_str += JSON.stringify(toindex);
            //rows_str += "\n";
        }
        //console.log(rows_str);
        var qArray = [];
	//execute_queries(queryArray);
        for (var i = 0; i < queryArray.length; i++) {
//	    console.log(queryArray[i]['label'] + '\n --- \n ' + queryArray[i]['query'] + '\n =========================');
	    csv_string += queryArray[i]['label'] + ', ';
	    console.log("Outside: " + i);
	    
	    client.query(queryArray[i]['query']).execute(function(error, res){
		console.log("Inside " + i);
	      var values = res.results.bindings;  
	      var nrOfRows = values.length;
		var nrOfColumns = res.head.vars.length;
		rows_str = nrOfColumns + ', "';
		// for (var i = 0; i < values.length; i++){
        	    //var toindex = {};
		var sortedColumns = res.head.vars.sort();
		
        	     for (var j = 0; j < sortedColumns.length; j++){
            		if (values[i][sortedColumns[j]] !== undefined){
			    toindex[sortedColumns[j]] = values[i][sortedColumns[j]].value;
			    //queryArray.push(toindex);
                	    //rows_str += sortedColumns[j] + ' : ' + values[i][sortedColumns[j]].value;
                	    rows_str += sortedColumns[j] + '; '
			    //rows_str += "\n ---- \n";
            		}
        	    } 
        	    rows_str += '", ' + nrOfRows;
		    csv_string += rows_str + '\n';
		    
        	    //qArray.push(toindex);
		    //console.log(rows_str);
		    //console.log('\n =========== \n');
		    //rows_str += "\n";
        	    //rows_str += JSON.stringify(toindex);
        	    //rows_str += "\n";
        	    //nrOfRows++;
    		// }
		//console.log('nrOfColumns = ' + nrOfColumns);
		//console.log('nrOfRows = ' + nrOfRows);
		//console.log('\n');
	    });
	} 
	//console.log(csv_string);
        //console.log(results);
        /* fs.writeFile('/home/razvan/Work/queryResults.csv', csv_string, function (err, data) {
            if (err) {
                return console.log(err);
            }
            console.log('Query executed !');
        }); */
    });
}


/* var execute_queries = function(queryArray) {
	for (var i = 0; i < queryArray.length; i++) {
	    //for (var j = 0; j < results.head.vars.length; j++) {
		console.log(queryArray[i]['label'] + '\n --- \n ' + queryArray[i]['query'] + '\n =========================');
	    //}
	}
//console.log(queryArray.length);
}*/

//fetch_queries(_endpoint, _query, _queryArray);
//execute_queries(queryArray);

