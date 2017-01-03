<?php
	
	$name = 'asdsad.amr';
	foreach (getallheaders() as $key => $value) {
		if($key == 'name'){
			$name = $value;
		}
	}

	if(isset($_FILES)){
		$namePath = split('__', $name);
		$dir = getcwd()."/".$namePath[0];

		if ( is_dir($dir) ){
			move_uploaded_file($_FILES["file"]["tmp_name"], $dir."/".$name);
		}elseif ( mkdir($dir, 0755, true) ) {
			move_uploaded_file($_FILES["file"]["tmp_name"], $dir."/".$name);
		}else{
			move_uploaded_file($_FILES["file"]["tmp_name"], getcwd()."/".$name);
		}
	}

	echo json_encode( array('echo' => 1 ) );

?>