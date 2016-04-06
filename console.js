// for display instructions executed
// prints output to web ui
// all ui events are written here

function printInstruction(instrString){
    "use strict";
    var display = document.getElementById('left_pane');
    var li = document.createElement('li');
    li.appendChild(document.createTextNode(instrString));
    display.appendChild(li);
}
/* to be removed
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
} */

function openFile(){
    showDropBox();
}

function showDropBox(){
    document.getElementById('fileDropBox').style.display = "block";
}

function hideDropBox(){
    document.getElementById('fileDropBox').style.display = "none";
}

function readFileContent(event){
    var file = event.target.files[0];
    
    if(file){
        var reader = new FileReader();
        var convertedBuf;
        
        reader.onload = function(e){
            var contents = e.target.result;
            codeSegment = new Uint16Array(contents);
            for(var i = 0; i < convertedBuf.length;i++){
                mem[i] = convertedBuf[i];
            }
            notify('Success','File read');
        }
        reader.readAsArrayBuffer(file);
    }else{
        alert('Failed to load file');
    }
    hideDropBox();
}

function addEventListeners(){
 document.getElementById('filesIn').addEventListener('change',readFileContent,true);
    
  document.addEventListener('DOMContentLoaded', function () {
  if (Notification.permission !== "granted")
        Notification.requestPermission();
  });
}

function notify(title,prompt){
    if(!Notification){
        alert('Desktop notifications not available');
        return;
    }
    
    if(Notification.permission !== "granted")
        Notification.requestPermission();
    else{
        var notification = new Notification(title, {
            body: prompt,
        });
        
    }
}