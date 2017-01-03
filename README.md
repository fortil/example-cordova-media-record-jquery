# Record media with cordova and send to server (android)
(For iOS only change config.xml for the values respectives and add platform iOS)


# Plugin de jQuery para grabar audios con cordova

Este plugin sirve para grabar audios con cordova, puede usar jQuery como en el ejemplo o puede usar 
```
let app = new RecordMedia({ idRegistro, idPregunta, max, nameServer, selector, cordovaDir });
app.init({ success, error })
```
si no quiere usarlo con jQuery


## Plugins necesarios
```
$ cordova plugin add cordova-plugin-media
$ cordova plugin add cordova-plugin-x-toast
// solo para usar el plugin de S3
$ cordova plugin add cordova-plugin-file-transfer
$ cordova plugin add https://github.com/fastrde/phonegap-md5.giter
```

Además está integrado con un plugin [para subir los audios a S3](https://github.com/fortil/s3-aws-upload-files) (ver ejemplo)
