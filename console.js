// for display instructions executed
// prints output to web ui

function printInstruction(instrString){
    "use strict";
    var display = document.getElementById('left_pane');
    var li = document.createElement('li');
    li.appendChild(document.createTextNode(instrString));
    display.appendChild(li);
}

<script>
    function handleFileSelect(evt){
        evt.stopPropagation();
        evt.preventDefault();

        var files = evt.dataTransfer.files;
        var output = [];

        for(var i = 0,f; f = files[i];i++){
            output.push(f.name);
            document.getElementById('list').innerHTML = output.join('') ;
        }
    }

    function handleDrageOver(evt){
        evt.stopImmediatePropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    }

    function openFile(){
        document.getElementById('fileDropBox').style.display = "block";
    }

/*     var dropzone = document.getElementById('drop_zone');
    dropzone.addEventListener('dragOver',handleDrageOver,false);
    dropzone.addEventListener('drop',handleFileSelect,false);
*/
</script>