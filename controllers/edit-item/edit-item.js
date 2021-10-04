const {ipcRenderer} = require('electron');

const editItemForm = document.querySelector("#edit-item-form");
const editItemSubmitBtn = editItemForm.querySelector("#edit-item-submit");
const editItemLabelInput = editItemForm.querySelector("#item-label");
const editItemValueInput = editItemForm.querySelector("#item-value");

/**
 * check des inputs
 */
function onInputCheckValue(){
    if(editItemLabelInput.value !== '' &&(!isNaN(editItemValueInput.value) && editItemValueInput.value > 0)){
        editItemSubmitBtn.hidden = false
    }else{
        editItemSubmitBtn.hidden = true
    }
}

//initialisation de la vue
ipcRenderer.on('init-data', (e,data)=>{
    editItemLabelInput.value = data.item.label;
    editItemValueInput.value = data.item.value;
})

//envoi du formulaire
function onSubmitedItemForm(e){
    //suppression de l'événement par défaut
    e.preventDefault();

    //objet édité
    const editItem = {
        label : editItemLabelInput.value,
        value: editItemValueInput.value
    };

    //channel d'édition
    ipcRenderer.invoke("edit-item",editItem).then(resp =>{
        const msgDiv = document.querySelector("#response-message");
        msgDiv.innerText = resp;
        msgDiv.hidden = false;
        setTimeout(()=>{
            msgDiv.innerText = '';
            msgDiv.hidden = true;

        },1500);

    } )
}

editItemLabelInput.addEventListener("input",onInputCheckValue);
editItemValueInput.addEventListener("input",onInputCheckValue);

editItemForm.addEventListener("submit",onSubmitedItemForm)