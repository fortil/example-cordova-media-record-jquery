declare const openDatabase: any

interface SQLConfig {
  name: string
  version?: string
  description?: string
  size?: number
}


// Data contructor (FP pattern)
export function SQL(config: SQLConfig){ 
  let dataName = config.name;
  let version:string = config.version || '1.0.0';
  let description:string = config.description || 'SQL DB';
  let size:number = config.size || (64 * 1024);
  let tableName: string = null;
  let fields: string = '';

  let res = {
    dataName,
    version,
    description,
    size,
    tableName,
    fields,
    db: openDatabase(dataName, version, description, size),
    /*
    * Recive un objeto "params" donde este tiene
    * name: el nombre de la tabla y
    * fields: un array de los campos que la tabla tendrá
    * Opcionalmente recibe un callback de un resultado positivo
    * y una función de un posible error
    */
    createTable: function (params:{tableName:string, fields:Array<any>}, success = (res:any) => console.log(res,'ok createTable'), error = (tx:any, e: any) => console.log(e,'error createTable')){
      this.tableName = params.tableName;
      let tableName = params.tableName;
      let flds: Array<string> = params.fields;

      for (var i = 0; i < flds.length; i++)
        this.fields += (i==0 ? flds[i] : `, ${flds[i]}`);

      this.db.transaction( (tx:any) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS ${tableName} (${this.fields})`,
          [],
          (tx:any, res:any) => success({tx,res,...this}),
          error
        );
      })
    },
    /*
    * Recive un objeto "records" en el cual se especifica 
    * la key es el campo a ingresar y el valor de la key el valor del campo
    * Ej: { id: 1, data1: 2, data2: 3 }
    */
    insert: function( records:any, success = (tx:any, result:any) => console.log(result,'ok insert'), error = (tx:any, e: any) => console.log("error insert",e) ){
      let keysRecords = Object.keys(records || {});
      let lengthKeysRecords = keysRecords.length;

      if( lengthKeysRecords > this.fields.split(',').length && lengthKeysRecords < this.fields.split(',').length)
        error('Error:',`La cantidad de valores a ingresar no es la misma que los campos de la tabla.\nCampos: ${this.fields} `)
      else if( !records || lengthKeysRecords <= 0 )
        error('Error:','Ingrese un objeto con las keys correspondientes, ej; {id:1, data1:2}')
      else{
        this.db.transaction( (tx:any) => {
          let values:string = "";
          let keys:Array<any> = [];
          for (var i = 0; i < lengthKeysRecords; i++){
            values += (i==0 ? "?" : ", ?"); 
            keys.push( records[keysRecords[i]] );
          }

          tx.executeSql(
            `INSERT INTO ${this.tableName} (${this.fields}) VALUES (${values})`,
            keys,
            success,
            error
          );
        })
      }
    },
    /*
    * Recive un array con los objetos del insert
    */
    insertValues: function( records:Array<any>, success = (tx:any, result:any) => console.log(result,'ok insert values'), error = (tx:any, e: any) => console.log("error insert values",e) ){
      
      if( records.length <= 0 )
        error('Erro','Inserte objetos ');
      else{
        let count:number = 0;
        let errors:Array<any> = [];
        let ress:any, txx:any;

        let fn = (cant:number) => {
           this.insert( records[cant], (tx:any, res:any) => {
            if( cant >= ( records.length-1 ) )
              success(tx, res);
            else
              fn( cant + 1 );

           },(tx:any, err:any) => {
             if( cant >= records.length ){
               errors.push( err );
               error(tx, errors);
             }else{
               errors.push( err );
               fn( cant + 1 );
             }

           })

        }


        fn( count );
      }
    },
    generateStrings: function(a:number, value:any, key:string ):any {
      let vals:Array<any> = [];
      let fds = '';

      if( typeof value == 'object' && value.OR  && value.OR.length > 0 ){
        for (var e = 0; e < value.OR.length; ++e) {
          fds += (e==0 ? `( ${key} = ? ` :  e==(value.OR.length-1)? ` OR ${key} = ? )`  : ` OR ${key} = ? `);
          vals.push(value.OR[e]);
        }
      }
      if( typeof value == 'object' && value.AND  && value.AND.length > 0 ){
        for (var e = 0; e < value.AND.length; ++e) {
          fds += (e==0 ? `( ${key} = ? ` :  e==(value.AND.length-1)? ` AND ${key} = ? )` : ` AND ${key} = ? `);
          vals.push(value.AND[e]);
        }
      }
      if( typeof value != 'object' ){
        fds += (a==0 ? `${key} = ? ` : ` AND ${key} = ? `);
        vals.push(value);
      }
      return {vals, fds};
    },
    /*
    * Recive un objeto "records" en el cual se especifica 
    * la key es el campo por el cual se eliminará la data y el valor es 
    * al que tendrá que hacer referencia del campo guardado
    * Ej: { id: 1, data1: 2} = 'WHERE id = 1 AND data1 = 2' o { id: { AND:[1, 2] } } = 'WHERE id = 1 AND id = 2'
    * { id: { OR: [1, 2] }, data2: 2 } = 'WHERE id = 1 OR id = 2 AND data2 = 2'
    */
    deleted: function(values:any, success = (tx:any, result:any) => console.log(result,'ok deleted'), error = (tx:any, e: any) => console.log("error deleted", e)){
      let keysValues = Object.keys(values || {});
      let lengthKeysValues = keysValues.length;

      if( (values != null && typeof values != 'object') || lengthKeysValues <= 0 ){
        error('Error:','Ningún campo para eliminar');
      }else{
        let vals:Array<any> = [];
        let fds = '';
        for (var i = 0; i < lengthKeysValues; i++){
          let obj = this.generateStrings(i, values[keysValues[i]], keysValues[i]);

          fds += obj.fds;
          vals.push(...obj.vals);
          
        }
        this.db.transaction( 
          (tx:any) => tx.executeSql(
            `DELETE FROM ${this.tableName} WHERE ${fds}`, 
            vals, 
            success,
            error
          )
        );
      }
    },
    /*
    * Recive un objeto "records" en el cual se especifica 
    * la key es el campo por el cual se obtendrá la data y el valor es 
    * al que tendrá que hacer referencia del campo guardado, si no se especifica nada se optienen todos los valores
    * Ej: { id: 1, data1: 2} = 'WHERE id = 1 AND data1 = 2' o { id: { AND:[1, 2] } } = 'WHERE id = 1 AND id = 2'
    * { id: { OR: [1, 2] }, data2: 2 } = 'WHERE id = 1 OR id = 2 AND data2 = 2'
    * * return a Array for the function success calback
    */
    getVal: function( values:any, success = (tx:any, result:Array<any>) => console.log(result,'ok getVal'), error = (tx:any, e: any) => console.log( "error getVal",e) ){
      this.db.transaction( (tx:any) => {

        let sqlString:string = `SELECT * FROM ${this.tableName}`;
        let fields = Object.keys(values || {});

        if( values && typeof values == 'object' && fields.length >= 0 ){

          let vals:Array<any> = [];
          let fds = '';
          for (var i = 0; i < fields.length; i++){
            let obj = this.generateStrings(i, values[fields[i]], fields[i]);

            fds += obj.fds;
            vals.push(...obj.vals);
            
          }

          sqlString += ` WHERE ${fds}`;
          
          tx.executeSql( sqlString, vals, 
            (tx:any, results:any) => {
              if(results.rows.length <= 0)
                success(tx, [])
              else{
                let resultsArray:Array<any> = [];
                for (var e = 0; e < results.rows.length; ++e) 
                  resultsArray.push(results.rows[e]);

                success(tx, resultsArray)
              }
            }, 
            error
          );
        }else{
          tx.executeSql(
            sqlString, 
            [], 
            (tx:any, results:any) => {
              if(results.rows.length == 0)
                success(tx, [])
              else{
                let resultsArray:Array<any> = [];
                for (var e = 0; e < results.rows.length; ++e) 
                  resultsArray.push(results.rows[e]);

                success(tx, resultsArray)
              }
            }, 
            error
          );
        }
      })
    },
    
    update: function(values:any, updates:any, success = (tx:any, result:Array<any>) => console.log(result,'ok getVal'), error = (tx:any, e: any) => console.log( "error getVal",e) ){
      //`UPDATE FILES SET name = ?, fullPath = ?, version = ?, date = ? WHERE id = ?`  
      let keysValues = values== null ? 'all' : Object.keys(values);
      let keysUpdates = Object.keys(updates || {});
      let lengthKeysValues = keysValues.length;

      if( (typeof values == 'string' && values != 'all') || lengthKeysValues <= 0 ){
        error('Error:','Ningún campo para eliminar');
      }else{
        let vals:Array<any> = [];
        let fds = '';
        let upFds = '';
        let sqlString = `UPDATE ${this.tableName}`;

        for (var e = 0; e < keysUpdates.length; ++e) {
          upFds += (e==0 ? ` ${keysUpdates[e]} = ? ` :  ` , ${keysUpdates[e]} = ? `);
          vals.push(updates[keysUpdates[e]]);
        }

        sqlString += ` SET ${upFds}`;

        if( typeof values != 'string' ){
          for (var i = 0; i < lengthKeysValues; i++){
            let obj = this.generateStrings(i, values[keysValues[i]], keysValues[i]);
            fds += obj.fds;
            vals.push(...obj.vals);
          }
          sqlString += ` WHERE ${fds}`;
        }

        this.db.transaction( 
          (tx:any) => tx.executeSql(
            sqlString,
            vals, 
            success,
            error
          )
        );
      }
    }
    
  }

  let espy = (fn:any) => ( ...arg:Array<any> ) => {
    return fn.apply( res, arg );
  }

  res.createTable = espy(res.createTable);
  res.insert = espy(res.insert);
  res.update = espy(res.update);
  res.getVal = espy(res.getVal);
  res.deleted = espy(res.deleted);

  return res;

}


