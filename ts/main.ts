'use strict'
import { SQL } from './websql';

declare const cordova: any;
declare const Media: any;
declare const $: any;
declare const jQuery: any;
declare const resolveLocalFileSystemURL: any; 
declare const FileUploadOptions: any; 
declare const FileTransfer: any; 

interface Window { 
  openDatabase: any;
  requestFileSystem: any;
  plugins: any;
  externalApplicationStorageDirectory: any;
  PERSISTENT: any;
  TEMPORARY: any;
  webkitRequestFileSystem: any;
}
declare global {
  interface Array<T> {
    equals(O:Array<any>): boolean;
  }
  interface NodeList{
    remove(o: any): any;
  }
  interface HTMLCollection {
    remove(o: any): any;
  }
}
function MakeId():string{
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 15; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

Array.prototype.equals = function (array:any) {
  if (!array)
    return false;

  if (this.length != array.length)
    return false;

  for (var i = 0, l=this.length; i < l; i++) {
    if (this[i] instanceof Array && array[i] instanceof Array) {
      if (!this[i].equals(array[i]))
        return false;       
    }           
    else if (this[i] != array[i]) { 
      return false;   
    }           
  }       
  return true;
}
Object.defineProperty(Array.prototype, "equals", {enumerable: false});

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove= function():void {
    for(var i = this.length - 1; i >= 0; i--) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}

interface interfaceStrings {
  recording:string;
  stoprecord:string;
  mjsrecord:string;
  alertmaxrecord:string;
  dialogconfirm:string;
  fields:string;
  tablename:string;
}
interface filesParamsInterface{ 
  id?:number
  path?:string
  name?:string
  selector?:any
  idRegistro?:string
  idPregunta?:string
  date?:any
}

interface argsInterface{ 
  idRegistro:string
  idPregunta:string
  maxRecords:number
  maxTime:number
  cordovaDir:string
  selector:any
  success?:any
  error?:any
}

interface argumentosInterface{selector:any, idRegistro:string, idPregunta:string, maxRecords:number, maxTime:number}

class RecordMedia {
  argumentos:argumentosInterface
  audio:any
  DB:any
  cordovaDir:string
  icons: { playIcon:string, stopIcon:string, deleteIcon:string }
  strings:interfaceStrings
  record:any
  functions:any;

  constructor ({ idRegistro = MakeId(), idPregunta = MakeId(), maxRecords = 10, maxTime = 10, cordovaDir = cordova.file.externalDataDirectory, selector = 'div' }:argsInterface){
    this.argumentos = { selector, idRegistro, idPregunta, maxRecords, maxTime };
    this.audio = {};
    this.DB;
    this.cordovaDir = cordovaDir;
    // Default Icons
    this.icons = { playIcon: this.getIcon('play_arrow'), stopIcon: this.getIcon('pause'), deleteIcon: this.getIcon('clear') };
    // Default strings
    this.strings = {
      recording: 'Detener grabación',
      stoprecord: 'Grabar audio',
      mjsrecord: 'Grabando audio....',
      alertmaxrecord: ' Llegó al máximo de grabaciones posibles ',
      dialogconfirm: 'Está seguro de eliminar el archivo ',
      fields: 'id,name,path,idRegistro,idPregunta,type,duration,date',
      tablename: 'RECORDS',
    };
    this.record = { recording: false, timerOut: null };
  }

  getIcon(icon:string){
    return `<i class="material-icons md-18">${icon}</i>`; 
  }

  init({ success = (res:any) => console.log(res), error = (error:any) => console.log(error) }){

    let btn = document.querySelector(this.argumentos.selector);
    // let btn = $(''+this.arguments.selector);
    btn.addEventListener('click', (evt:any) => {
      evt.preventDefault();
      this.recordAudio( this.argumentos )
    }, false)

    // Otiene los strings a mostrar, sino hay deja los default
    this.strings = {
      recording: ( btn.dataset.recording || this.strings.recording ),
      stoprecord: ( btn.dataset.stoprecord || this.strings.stoprecord ),
      mjsrecord: ( btn.dataset.mjsrecord || this.strings.mjsrecord ),
      alertmaxrecord: ( btn.dataset.alertmaxrecord || this.strings.alertmaxrecord ),
      dialogconfirm: ( btn.dataset.dialogconfirm || this.strings.dialogconfirm ),
      fields: ( btn.dataset.fields || this.strings.fields ),
      tablename: ( btn.dataset.tablename || this.strings.tablename ),
    }
    this.icons = {
      playIcon: ( btn.dataset.playicon || this.icons.playIcon ),
      stopIcon: ( btn.dataset.stopicon || this.icons.stopIcon ),
      deleteIcon: ( btn.dataset.deleteicon || this.icons.deleteIcon )
    }
    this.functions = {success, error};
    this.DB = SQL({name: 'RecordMedia', description: 'Save records media', size: 64 * 1024});
    this.DB.createTable({tableName:this.strings.tablename, fields:this.strings.fields.split(',')},(args:any) => {
      this.DB = args
    },error)
    //   table: {name: this.strings.tablename, fields: this.strings.fields.split(',') },
    //   app: this.arguments,
    // });

    let divMsj = document.createElement('div');
    divMsj.className = `mensaje alignAbsoluteCenter ${this.argumentos.idRegistro} ${this.argumentos.idPregunta}`
    divMsj.innerHTML = divMsj.innerHTML + this.strings.mjsrecord
    btn.parentNode.insertBefore(divMsj, btn)

    // btn.after(this.strings.mjsdivrecord);
    this.initView();
  }

  initView( ){
    // JS form
    let medias = document.querySelector('#content-'+this.argumentos.idRegistro+'_'+this.argumentos.idPregunta);
    if( medias != undefined )
      medias.innerHTML = ''

    let idRegistro = this.argumentos.idRegistro;
    let idPregunta = this.argumentos.idPregunta;

    this.DB.getVal({ idPregunta, idRegistro }, (tx:any, songs:any[]) => {

      if(songs.length > 0){
        for (var i = 0; i < songs.length; i++) {
          songs[i].selector = this.argumentos.selector;
          songs[i].maxRecords = this.argumentos.maxRecords;
          this.addAudioView(songs[i]);
        }
      }

    }, this.functions.error);
  }


  changeIconView(id:number, icon:string){
    document.getElementsByClassName('play '+id)[0].innerHTML = icon;
    // jQuery Form
    // $('.play.'+id).html(icon);
  }

  playPauseAudio( { id, path, name, selector, idRegistro, idPregunta }:filesParamsInterface ){
    let playIcon = this.icons.playIcon;
    let stopIcon = this.icons.stopIcon;
    let element:any = document.getElementsByClassName('range ex1-'+id)[0];
    let dur = 100;
    let mediaTimer:any = ():void => {};

    let playStateFunc = () => {
      this.audio.id = id;
      this.audio.estado = 'play';
      this.audio.media.play();
      this.changeIconView(id, stopIcon);
      // element.value = 0;
      mediaTimer = setInterval( () => {
        dur = this.audio.media.getDuration() * 100 ;
        dur = dur <= 0 ? (-1*dur) : dur;
        element.max = dur;

        this.audio.media.getCurrentPosition(
          (position:any) => {
            this.audio.pos = position * 100;

            if( this.audio.pos <= 0 ){
              stopStateFunc( 0 )
            }else if(this.audio.estado == 'pause'){
              stopStateFunc( this.audio.pos )
            }else{
              element.value = this.audio.pos;
            }
          },
          this.functions.error
        );
        
        if (dur == 0 || this.audio.estado == 'pause' ){
          stopStateFunc( 0 );//{audio: this.audio, element })
        }
      }, 500)
    }

    let stopStateFunc = ( pos:any ) => {
      this.audio.estado = 'pause';
      this.audio.media.pause();
      clearInterval(mediaTimer);
      element.value = (typeof pos == 'number' ? pos : this.audio.pos);
      this.changeIconView(id, playIcon);
    }

    if( this.audio && this.audio.id == id && this.audio.estado != 'pause'){
      stopStateFunc( 0 );
    }else if( this.audio && this.audio.id == id && this.audio.estado == 'pause' ){
      playStateFunc();
    }else{
      this.audio = {};
      this.audio.media = new Media( path,
        (e:any) => { console.log('Success ',e); this.changeIconView(id, stopIcon); },
        (err:any) => { console.log('err ',err); this.changeIconView(id, playIcon); },
        (e:any) => { 
          if( e == 3 ){
            stopStateFunc( this.audio.media._position * 100 ); 
          }else if( e == 4 ) { 
            this.DB.update({ id },{ duration: this.audio.media._duration } ); 
            stopStateFunc( 0 ); 
          }
        }
      );
      playStateFunc();
    }

  }
  removeAudio( { id, path, name, selector, idRegistro, idPregunta }:filesParamsInterface ){

    if(confirm(this.strings.dialogconfirm+' '+name)){
      resolveLocalFileSystemURL( this.cordovaDir, (dir:any) => {
        dir.getFile(name , { create: true }, (file:any) => {
          file.remove( (files:any) =>{
            this.DB.deleted({ id }, (tx:any, res:any) => {
              if( res.rowsAffected > 0){
                document.getElementsByClassName(`MediaRecord-media ${id}`)[0].remove();
                // document.querySelector('#content-'+idRegistro+'_'+idPregunta).remove()
                // jQuery Form
                // $('#content-'+idRegistro+'_'+idPregunta).remove();
                // this.initView();
                this.functions.success(res)
              }
            });
          }, this.functions.error );
        });
      });
    }

  }

  recordAudio({ selector, idRegistro, idPregunta, maxRecords, maxTime }:argumentosInterface){
    let store = this.cordovaDir; //externalApplicationStorageDirectory; // window.externalApplicationStorageDirectory || window.PERSISTENT || window.TEMPORARY;
    let id = Date.now();
    let name =   idRegistro + '_' + idPregunta + '__' + id +'.amr';
    let path = store + name;
    this.DB.getVal(null, (tx:any, songs:Array<any>) => {

      let lengthSongs = songs.length || ( typeof songs == 'object' ? Object.keys(songs).length : 0)
      if( lengthSongs >= maxRecords ){
        this.functions.error(this.strings.alertmaxrecord);
      }else{
        if( this.record.recording == true ){
          clearTimeout( this.record.timerOut );
          this.record.media.stopRecord();
          this.record.recording = false;
          this.stopRecordView( selector );
        }else{

          this.record.timerOut = setTimeout(()=>{
            if( this.record.recording == true ){
              clearTimeout( this.record.timerOut );
              this.record.media.stopRecord();
              this.record.recording = false;
              this.stopRecordView( selector );
            }
          }, this.argumentos.maxTime )

          this.record.recording = true;
          this.record.media = new Media( path , 
            (e:any) => { 
              this.functions.error("Success ",e)
              this.addAudio({ id, path, name, selector, idRegistro, idPregunta }); 
            }, 
            this.functions.error );
          this.record.media.startRecord();
          this.startRecordView.bind(this)( selector );
        }
      }
      
    } );

  }

  addAudio({ id, path, name, selector, idRegistro, idPregunta }:filesParamsInterface){
    // ['id', 'name', 'path', 'idRegistro', 'idPregunta', 'type', 'duration', 'date']
    let date = new Date().getTime();
    this.DB.insert( {id, name, path, idRegistro, idPregunta, 'type':'audio', 'duration':'4.0', date } ); 
    this.addAudioView.bind(this)({ id, path, name, selector, idRegistro, idPregunta, date })
  }

  startRecordView( selector:any ){
    document.querySelector( selector + '').innerHTML = this.strings.recording;
    let doc = document.getElementsByClassName( 'mensaje '+this.argumentos.idRegistro+' '+this.argumentos.idPregunta)[0]  as HTMLDivElement
    doc.style.visibility = 'visible';
  }

  stopRecordView( selector:any ){
    document.querySelector( selector + '').innerHTML = this.strings.stoprecord;
    let doc = document.getElementsByClassName( 'mensaje '+this.argumentos.idRegistro+' '+this.argumentos.idPregunta)[0]  as HTMLDivElement
    doc.style.visibility = 'hidden';
  }

  addAudioView( audio:filesParamsInterface ){

    let playPauseAudio = this.playPauseAudio.bind(this);
    let removeAudio = this.removeAudio.bind(this);
    let template = this.templateAudio.bind(this)(audio);

    // JS Form
    let reg = document.querySelector( '#content-'+audio.idRegistro+'_'+audio.idPregunta);
    if( reg == undefined ){
      let btnAudio = document.querySelector( ''+audio.selector );
      let father = btnAudio.parentElement;
      let playList = document.createElement('div');
          playList.id = "content-"+audio.idRegistro+"_"+audio.idPregunta;
      father.insertBefore(playList, btnAudio);
    }

    document.querySelector( '#content-'+audio.idRegistro+'_'+audio.idPregunta)
      .insertAdjacentHTML('beforeend', template)

    document.getElementsByClassName('play ' + audio.id)[0]
      .addEventListener('click', () => playPauseAudio(audio) , false );
      document.getElementsByClassName('remove ' + audio.id)[0]
      .addEventListener('click', () => removeAudio(audio) , false );

  }

  templateAudio( audio:filesParamsInterface ){
    let date  = (new Date(audio.date).toISOString()).split('T');
    let time = date[1].split('.')[0];
    let dateStr = `${date[0]} ${time}`;
    return `<div class="MediaRecord-media ${audio.id} ${audio.idRegistro} ${audio.idPregunta}">
      <div class="MediaRecord-buttons-media">
        <button data-url="${audio.path}" data-name="${audio.name}"  data-idregistro="${audio.idRegistro}" data-idpregunta="${audio.idPregunta}" class="play ${audio.id}">${this.icons.playIcon}</button>
        <input class="range ex1-${audio.id}" type="range" value="0" min="0" max="100"/>
        <button class="remove ${audio.id}" >${ this.icons.deleteIcon }</button>
      </div>
      <div class="MediaRecord-date">${dateStr}</div>
    </div>`
  }

}

(<any>window).RecordMedia = RecordMedia || {};

if( jQuery ){
  (function( $ ){
     $.fn.recordMedia = function({ 
             idRegistro,
             idPregunta,
             maxRecords,
             maxTime,
             cordovaDir,
             success,
             error }:argsInterface) {

      let selector = this.selector;  
      let app = new RecordMedia({ idRegistro, idPregunta, maxRecords, maxTime, selector, cordovaDir });
      // let init = app.init.bind(app);
      app.init({ success, error })
      // document.addEventListener('deviceready', init , false);
      return { element: this, app: app };
     }; 
  })( jQuery )
}