


type InlineJson = string;

//inlineJson Format tokens
export enum delimeterType
{
    value = '||',
    pop0 = '|0', 
    pop1 = '|1',
    pop2 = '|2',
    pop3 = '|3',
    pop4 = '|4',
    pop5 = '|5',
    nullValue = '|6',  
    singleNode = '|7',
    arrayNode = '|8',
    newRecord = '|9',
    newLine = '|n'
}

/**
 * @description Convert a salesforce json to inline json, excluding "attribute" nodes
 * @param salesforceJson 
 * @returns 
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function salesforceJsontoInlineJson(salesforceJson: any): InlineJson {
    const records = salesforceJson.records;
    let header: string[] = [];     // it is used to store the header of the records 
    let headerExt: string[] = [];  // it is used to store the header of the subrecords when the header is not defined in the first record therefoce it is necessary to store it to be added to the header when it is defined
    let currentRow: string[] = []; // it is used to store the current data row of the records
    let indexRow: number = 0;      // it is used to store the index of the current data row of the records  
    let rows: string='';           // it is used to store the rows of the records in inline json format  
    let indexHeader: number = 0;   // 
    console.log(salesforceJson);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    records.forEach((record: any) => {
        for (const [key, value] of Object.entries(record)) {
            // skip attributes
            if (key === 'attributes') {
                continue;
            }
            if (typeof value!=='object' || value===null) {
                // we are dealing with a primitive value
                // data part
                currentRow[indexRow] = (value===null)?delimeterType.nullValue:`${delimeterType.value}${value}`;
                indexRow++; 
                // header part  
                if (header[indexHeader]===undefined)  {
                   // happy path scenario where the header is not defined yet
                   header[indexHeader] = `${delimeterType.value}${key}`;
                } else {
                     // it only can be occur when a node has been read in previus records but in this record this node is assigned to null, 
                     // so we need to skip the header of the defined object, looking for pop0 token. If value is not null should be an errror
                   if (value===null && header[indexHeader].startsWith(delimeterType.arrayNode)) {
                       do {
                           indexHeader++;
                       } while (header[indexHeader]!==undefined && !header[indexHeader].startsWith(delimeterType.pop0));
                       
                   }
                }
                // increment the index of the header
                indexHeader++;
            } else {
                // we are dealing with an object
                // data part: only store the token
                currentRow[indexRow] = `${delimeterType.arrayNode}`   
                // header part
                if (header[indexHeader]===undefined) {
                    // happy path scenario where the header is not defined yet
                    header[indexHeader] = `${delimeterType.arrayNode}${key}`;
                }  else {
                    // it only can be occur when the header is not defined in the previus record but it is defined now. 
                    // so we need insert this node definition in the header and add the subrecords header that was stored in the headerExt array
                    if (header[indexHeader].startsWith(delimeterType.value))  {
                        header[indexHeader] = `${delimeterType.arrayNode}${key}`;
                        headerExt = header.slice(indexHeader+1, header.length+1); // backup the rest of the header
                        header=header.slice(0, indexHeader+1); // keep the header until the current node
                        
                    }
                }
                indexHeader++;
                indexRow++;
                // process the subrecords
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const subrecords = (value as any).records;
                let firstrecord = true;
                //the first interation we build the header of the subrecords
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                subrecords.forEach((subrecord: any) => {
                    if (!firstrecord) {
                        currentRow[indexRow] = `${delimeterType.newRecord}`   
                        indexRow++;
                    } 
                    
                    for (const [key2, value2] of Object.entries(subrecord)) {
                        if (key2 === 'attributes') {
                            continue;
                        }                
                        currentRow[indexRow] = (value2===null)?delimeterType.nullValue:`${delimeterType.value}${value2}`;   
                        if (header[indexHeader]===undefined && firstrecord ) { header[indexHeader] = `${delimeterType.value}${key2}`; indexHeader++; }  
                        
                        indexRow++;   
                    }
                    firstrecord = false;
                });
                // add end of object token "pop0"
                if (header[indexHeader]===undefined)  header[indexHeader] = `${delimeterType.pop0}`;
                indexHeader++;
                currentRow[indexRow] = `${delimeterType.pop0}`
                indexRow++;
            }
            // if headerExt is not empty, we need to add it to the header
            if (headerExt.length>0) {
                header = header.concat(headerExt);
                headerExt = [];
            }            
        }  // end  of the record
        // build the row
        currentRow.forEach((valor) => {rows+=valor;})
        rows+=delimeterType.newLine;
        currentRow=[];
        indexRow = 0;
        indexHeader = 0;
    }); // end of forEach
    let data  = '';
    header.forEach((valor) => {data+=valor;})
    data += delimeterType.newLine;
    data += rows;
return data;

}




/**
 * @description Convert an inline json to array
 * @param data as inline json format
 * @returns InlineJsonArray
 */
export function inlineJsonToArray(inlineJson: InlineJson): InlineJsonArray {
    // TEMPORARY VARIABLES
    let word = ''; // it stores the current word
    let objectName = ''; // it stores the object name
    let backToken = '';
    let columnObjectMark = 0; // it stores the index when the last object starts to be defined
    let index = 0; // it is used to store the index of the current character
    //Result
    const captions: Captions[] = []; 

    // Caption part
    do {
        const token: string  = inlineJson.slice(index,index+2); // read the next 2 characters 
        
        if (inlineJson[index]==="|") { // it comes a token
            
            if (word!=='' )  {
                // word from prevuios token
                if (backToken === delimeterType.value)  captions.push({fieldName: word, objectName, quantity:1 }); 
                if (backToken === delimeterType.arrayNode)  objectName=word;  
                word = '';
            }
            if (token === delimeterType.arrayNode)  columnObjectMark = captions.length;
            if (token === delimeterType.pop0)       captions[columnObjectMark].quantity = captions.length - columnObjectMark; 
            if (token === delimeterType.newLine)   break;
            backToken = token;
            index+=2;
        } else {
            word += inlineJson[index]; index++;   
        }  
    } while (index<inlineJson.length && inlineJson[index]!==delimeterType.newLine);

    // Data part
    let dataIndexRow = 0;
    let columnObjectIndex = 0;
    //Result
    const rows: Rows[] = [];
    rows[dataIndexRow] = { col: []};
    columnObjectMark = 0;
    do {
        const token: string  = inlineJson.slice(index,index+2);
        if (inlineJson[index]==="|") {
            if (word!=='' )  {
                if (backToken === delimeterType.value) { 
                    if (columnObjectIndex===0) { rows[dataIndexRow].col.push(word); }
                    else { rows[dataIndexRow].col[columnObjectIndex] += '|'+ word;
                        columnObjectIndex++;
                     }
                }    
                word = '';
            }
            if (token === delimeterType.nullValue)  {
                if (columnObjectIndex===0) {
                    //scenario: null value in the first column, that means the object is null and we need to add the rest of the columns
                    const added : string[] = Array(captions[ rows[dataIndexRow].col.length  ].quantity).fill('|');  
                    rows[dataIndexRow].col = rows[dataIndexRow].col.concat(added);
                } else {
                    //scenario: null value in the middle of the columns, that means the object is not null but the value of any column is null
                    rows[dataIndexRow].col[columnObjectIndex] += '|'; 
                    columnObjectIndex++;
                }
            }
            if (token === delimeterType.arrayNode) { 
                columnObjectIndex=0;
                columnObjectMark=rows[dataIndexRow].col.length;
            }
            if (token === delimeterType.newRecord) { 
                columnObjectIndex=columnObjectMark;
            }
            if (token === delimeterType.pop0) { 
                columnObjectIndex=0;
            }
            if (token === delimeterType.newLine) { 
                dataIndexRow++;
                columnObjectIndex=0;

                rows[dataIndexRow] = { col: []};
            }
            backToken = token;
            index+=2;
        } else {
            word += inlineJson[index]; index++;   
        }
    } while (index<inlineJson.length);
    return {captions, rows};
}