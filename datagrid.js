// URL to your production code when you publish yoru google app script as a web app
// You will get this URL when you publish your google apps script as a web app
let prefix="YourWebAppURLHere" // looks like: https://script.google.com/macros/s/AKfycbz90JgtbAjrjz8c8WQGjgy8kM2GtdCAulom8XWOQyGoeX8DXM5XsmUMAcSYSSyZwwNSLq/exec
const dealy_seconds = 4 // how long data validation messages are visible

//example call: file:///C:/Users/Gove/three-tier/datagrid.html?employee

function start_me_up(){  // runs when the body has loaded
    if(!prefix){prefix=prompt("Enter your Google Apps Web App access point.")}
    const table=window.location.search.substr(1)               // read the table from the url
    if(table){
        get_data(table)                                        // a table has been specified in the URL, open it
    }else{
        window.location.replace(window.location + "?Employee") // no table supplied in the URL, default to the Employee table
    }    
}

function get_data(table){ // get data from airtable for the specified table using the google apps script specfied atop this file
    document.title=table                                                 // put the table name on the browser tab holding the data
    const script = document.createElement('script')                      // make a new scrip tag to allow us to fetch data from google apps script
    script.id="data-script"                                              // set the ID of the sript tag so we can refer to it later
    script.onload = show_data                                            // after the script is loaded, run the show_data function
    script.src = prefix+'?table='+table+'&limit=100'+"&time="+Date.now() // get the script from google apps script
    document.head.appendChild(script)
}

function show_data(){  // the function that is executed when table data arrives
    if(data.exception){show_exception();return}          // there was an exception in the google apps script, show the message and exit

    const table=document.createElement('table')          // make a new TABLE element
    const static=[]                                      // build an array to keep track of which fields are read only
    table.id="data-table"                                // set the ID of the table
    let thead = table.createTHead();                     // build the table heading
    let row = thead.insertRow();                         // put a row in the table heading
    for (const field of data.structure) {                // iterate across the fields in the data structure
        let th = document.createElement("th");           // create a TH tag for the column name
        let text = document.createTextNode(field.label); // create a text node to hold the name of the column
        th.appendChild(text);                            // put the field label text node in the column header
        row.appendChild(th);                             // put the TH tag into the row
        if(field.static){static.push(field.name)}        // if a field is marked as static, add it to the read-only list
    }
    let tbody = table.createTBody();                     // build the table body--now rows yet
    document.getElementById('data').appendChild(table)   // put the table onto the document
    for(const record of data.records){                   // itreate over the records received 
        add_row(record, tbody, static)                   // and make a row for each record received
    }    
}

function add_row(record, body, static){ // adds a row to the table body specified using data from record
    let row = body.insertRow()                                           // make a new row on the table
    for(const field of data.structure){                                  // iterate over the data structure
        add_cell(field, record.fields[field.name], row, record.id,static)// build a cell for each field in the data structure
    }
}

function add_cell(field, value, row, id, static){ // adds a cell to a row
    let cell = row.insertCell();                            // make a new TD element in the table row
    if(static.includes(field.name)){
        cell.className = "read-only"                        // set the cell to appear as a read only column
        let text = document.createTextNode(value);          // create a text node to hold the value of the cell
        cell.appendChild(text);                             // put the field value text node in the table cell
    }else if(Array.isArray(value)){                         // check to see if the field is an array of values.  If so, treat it differntly.  For now, the only type we are handling is images
        for(const entry of value){                          // loop through the entries in the array 
            if(entry.url){                                  // if the entry has a url property, assume it is a picture
              const img = new Image();                      // make a new image object in the HTML document
              img.src = entry.url                           // set the source of the image
              img.height = 15                               // set the height of the image so it will fit in a cell
              const anchor = document.createElement('a')    // make an achor tag so we can link to the full image
              anchor.href = entry.url                       // set the link our anchor will follow
              anchor.target = "_blank"                      // set the target to open the link in a new tab
              anchor.appendChild(img)                       // put the image in the anchor
              cell.appendChild(anchor)                      // put the anchor in the cell
            }
            cell.appendChild(document.createTextNode(" "))  // add a space so the images are not crammed together
        }
    }else{                                                  // field is allowed to be edited
        const input=document.createElement('input')         // make an INPUT tag to put in the cell so the data is editable
        input.type="text"                                   // set the type of the INPUT so this will be editable data
        if(value!=undefined){input.value=value}             // if a value was passed in, put it in the value of the INPUT tag
        input.size = field.width                            // set the size of the input tag width specified
        input.onchange = change_value                       // confiture the INPUT tag so that it will execute the change_value function when the user changes the value 
        input.id = data.table + "-" + id + "-" + field.name // set up the id of of the INPUT tag so we know just what data to change in the database
        cell.appendChild(input)                             // put the fully configured INPUT tag into the cell
    }    
}

function change_value(){ // is triggered when a user changes a value in a cell of the table
    const params=this.id.split("-")                      // split the INPUT tag's id into its component parts
    switch(params[0]){                                   // Presentation layer data validation. params[0] is the table name
        case "Employee":                                 // validating fields in the employee table  
            switch(params[2]){                           // params[2] is the field name 
                case "first_name":                       // validating the first_name field of the employee table  
                    console.log("changing first name")
                    break
                default:    
            }
            break
        case "Door":                                     // validating fields in the door table
            break
        default:        
    }

    this.className="pending"                             // change the class of the INPUT tag holding the data to give a visiual cue that the data has not yet been written to the database
    if(document.getElementById('data-script')){          // if we have already fetched data using this script tag, remove the old one
        document.getElementById('data-script').remove()
    }
    const script = document.createElement('script')      // create a new script tag to receive the data from google apps script
    script.id="data-script"                              // set the id so we can refer to it later  
    script.onload = handle_message                       // configure the script so that it will execute the handle_message fucntion when it has been update
    script.src=prefix                                    // set the source of the script so it will call the google apps script with the appropriate parameters
               + "?mode=update&table=" + params[0]  
               + "&record=" + params[1] + "&field=" 
               + params[2] + "&value="
               + encodeURIComponent(this.value)
               + "&time=" + Date.now()    
    document.head.appendChild(script)                    // add the script the document heading
}

 function handle_message(){ // deals with the data returned after updating (or failing to update) a column value on airtable through google apps script
    console.log("data",data)
    if(data.exception){show_exception();return}                  // there was an exception in the google apps script, show the message and exit
    
    const tag = document.getElementById(data.table + "-"         // find the INPUT tag that has the data the user entered
                                      + data.record + "-" 
                                      + data.field)
    if(data.error){                                              // see if the message that came back from google apps script has an error message
      tag.className="error"                                      // there is a error message, so make the INPUT tag look like an error (red background) by default, but you could change it in style.css
      const row=tag.parentElement.parentElement                  // get a reference to the row that contatins the cell that contains the INPUT tag that the user changed
      const table = document.getElementById("data-table")        // get a reference to the table that holds the data
      const cell = table.insertRow(row.rowIndex+1).insertCell(0) // insert a row after the row that hold the field the user changed AND insert a cell on the row
      cell.innerHTML = data.error.message                        // put the the error message in the newly added cell
      cell.colSpan=row.cells.length                              // make the cell span the whole width of the table 
      cell.className="message"                                   // put the right class so it will be styled according to style.css
      let delay=setInterval(function(){                          // initiate the function to clear the message after the nubmer of seconds specified atop this file
        if(data.value){                                          // Google apps script sent back a value to replace the users entered value.  This could be becuase it is reverting to a prior value or because it formatted what the user entered  
            tag.className=""                                     // change the style of the INPUT tag to be normal data
            tag.value=data.value                                 // replace the value the user entered with the value passed back from google apps script
        }else{                                                   // there was no value passed back from google apps script
            tag.focus()                                          // set the focus to the INPUT tag, but leave it formatted as an error and leave the value the user typed.  It needs work.
        }
        table.deleteRow(row.rowIndex+1)                          // delete the row in the table added to show the error message
        clearInterval(delay)                                     // prevent another call to this function because it has been handled
      }, dealy_seconds*1000);                                    // part of the initial call to clear the message.  This line specifies how long to wait to clear the message
    }else{                                                       // there is no error message, just update with any correction that came back 
        if(data.value){                                        
            tag.value=data.value                                 // there is a value sent back. update the value in the INPUT tag
        }else{
            tag.value=""                                         // there is no value sent back. clear the INPUT tag
        }
        tag.className=""                                         // remove the "pending" class from the INPUT tag so the field looks like regular data again
    }
}

function show_exception(){
    const tag = document.getElementById("exception")
    tag.innerHTML = data.exception
    tag.style.display = "block"
}

