// for display instructions executed
// prints output to web ui
// all ui events are written here

function printInstruction(str){
    var formattedOut = '';
    for(var i = 0; i < str.length;i++)
        formattedOut += '<span style="background-color: lightgrey;">'+str[i]+'</span>'; document.getElementById('executed_instruction').innerHTML = formattedOut;
}

function printRegisterContent(regs){
    var data = '<tr><th>Register</th><th>Value</th></tr>';
    for(var i = 0; i < regs.length;i++){
            data += '<tr>'+'<td>R'+i+'</td>'+'<td>'+regs[i]+'</td>'+'</tr>';
    }
    document.getElementById('register_content').innerHTML = data;
}


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
        
        reader.onload = function(e){
            var contents = e.target.result;
            codeSegment = new Uint16Array(contents);
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