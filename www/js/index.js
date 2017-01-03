
document.addEventListener('deviceready', function(){

  var idRegistro = '52154';
  var idPregunta = '441121';
  var max = 5;

  $('#recordSong').recordMedia({ 
    'idRegistro': idRegistro, 
    'idPregunta': idPregunta, 
    'max': max });
  $('#recordSong2').recordMedia({ 
    'idRegistro': idRegistro, 
    'idPregunta': 'cual', 
    'max': max });


  $('#upload').click(function(event) {
    $('*[data-url*="file"]').each(function(index, el) {

      var filePath = $(this).data('url');
      var fileName = $(this).data('name');
      /*
      * Sube archivos a S3 aws
      */
      setTimeout(function(argument) {
        s3Uploader(
          {
            filePath: filePath,
            bucket: Bucket,
            awsKey: awsKey,
            secret: secret,
            folder: Folder,
            fileName: fileName,
            urlServer: urlAWS,
          },
          true
        )
      }, 0)

      // UploadRecordMedia({
      //   path: $(this).data('url'),
      //   nameServer: 'http://192.168.0.16/upload/upload.php'
      // }, function ( state, stateUpload) {
      //   // state devuelve un objeto si fue éxitosa la subida o no
      //   // stateUpload devuelve un objeto del proceso de la carga
      //   console.log( state, stateUpload );
      // })
    });
  });

}, false);

var UploadRecordMedia = function( DATA, callback ){

  function upload(data, cb) {
    var uri = encodeURI( data.nameServer );
    var name = getName( data.path );
    var options = new FileUploadOptions();

    options.fileKey = "file";
    options.fileName = name;
    options.mimeType = "application/octet-stream";

    var headers = { 'name' : name };

    options.headers = headers;

    var ft = new FileTransfer();
    ft.onprogress = function(progressEvent) {
      if (progressEvent.lengthComputable) {
        cb(null, {loaded: progressEvent.loaded, total: progressEvent.total});
      } else {
        cb(null, {});
      }
    };
    ft.upload( data.path, uri, function(e) { cb(e, null) }, function(e){ cb(e, null) }, options);
  }

  function getName( str ) {
    var arr = str.split('/');
    return arr[arr.length - 1];
  }
  setTimeout(function(){upload(DATA, callback)},0);
}