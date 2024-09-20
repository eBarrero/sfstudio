/* eslint-disable @typescript-eslint/no-explicit-any */



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





type RecordSet = Map<string, string[]>;
let recordSet: RecordSet;
let recordIndex: number;



function processCaption(record: any, path: string ): void {
    function details(key: string, value: any): void {
        // skip attributes
        if (key === 'attributes') {
            return;
        }
        const fieldName = path + key;
        if (typeof value!=='object' || value===null) {
            if (!recordSet.has(fieldName)) recordSet.set(fieldName, []);
            if (recordSet.get(fieldName)![recordIndex]===undefined) {
                recordSet.get(fieldName)![recordIndex]= value;
            } else {
                recordSet.get(fieldName)![recordIndex]+= "|" + value;
            }
        } else {    
            if ( (value.records!==undefined)) {
                processCaption(value['records'], `${fieldName}.`);
            } else {
                processCaption(value, `${fieldName}.`);
            }
        }
    }
    
    if (Array.isArray(record)) {
        record.forEach((element: any) => {
            for (const [key, value] of Object.entries(element)) {   
                details(key, value);
            }
            if (path==='')  recordIndex++;
        });    
    } else {
        for (const [key, value] of Object.entries(record)) {
            details(key, value);
        }    
       
        
    }
}    

export function salesforceJsontoInlineJson(salesforceJson: any): InlineJsonArray {
    recordSet = new Map<string, string[]>;
    recordIndex = 0;
    processCaption(salesforceJson.records, '' );
    console.log(recordSet);
    const captions: Captions[] = [];         
    const rows: Rows[] = [];
    let col: number=0;   recordSet.forEach((value, key) => {
        const path = key.split('.');
        const fieldName = path[path.length-1];
        const objectName = path.slice(0, path.length-1).join('.');
        const quantity = 0;
        captions.push({fieldName, objectName, quantity});
        value.forEach((element, index) => {
            if (col===0) rows[index] = {col: []};
            rows[index].col[col] = (element===null)?'null':  element.toString();
        });
        col++;
        
    });
    
    return {captions, rows};
}


/**
 * @description Convert a salesforce json to inline json, excluding "attribute" nodes
 * @param salesforceJson 
 * @returns 
 */
export function xsalesforceJsontoInlineJson(salesforceJson: any): InlineJson {
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




