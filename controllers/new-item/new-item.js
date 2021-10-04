const {ipcRenderer} = require('electron');

const newItemForm = document.querySelector("#new-item-form");
const newItemSubmitBtn = newItemForm.querySelector("#new-item-submit");
const newItemLabelInput = newItemForm.querySelector("#item-label");
const newItemValueInput = newItemForm.querySelector("#item-value");

/**
 * check des inputs
 */
function onInputCheckValue(){
    if(newItemLabelInput.value !== '' &&(!isNaN(newItemValueInput.value) && newItemValueInput.value > 0)){
        newItemSubmitBtn.hidden = false
    }else{
        newItemSubmitBtn.hidden = true
    }
}

//envoi du formulaire
function onSubmitNewItemForm(e){
    e.preventDefault();

    const newItem = {
        label : newItemLabelInput.value,
        value: newItemValueInput.value
    };

    ipcRenderer.invoke("new-item",newItem).then(resp =>{
        const msgDiv = document.querySelector("#response-message");
        msgDiv.innerText = resp;
        msgDiv.hidden = false;
        setTimeout(()=>{
            msgDiv.innerText = '';
            msgDiv.hidden = true;

        },1500);

        e.target.reset();
        newItemSubmitBtn.hidden = true;
    } )
}

newItemLabelInput.addEventListener("input",onInputCheckValue);
newItemValueInput.addEventListener("input",onInputCheckValue);

newItemForm.addEventListener("submit",onSubmitNewItemForm)