const {ipcRenderer} = require("electron");

let cbEditedItem;

/**
 * fonction de création de ligne d'item
 * @param tbodyId tableau à modifier
 * @param data items à insérer
 */
function generateRowLine(tbodyId,data){
    //récupération du tableau
    const tbody = document.querySelector("#"+tbodyId);
    //ajout des éléments
    data.forEach(item=>{
        const tr = document.createElement("tr");

        const thId = document.createElement("th");
        thId.scope = 'row';
        thId.innerText = item.id;

        const tdLabel = document.createElement("td");
        tdLabel.innerText = item.label;

        const tdValue = document.createElement("td");
        tdValue.innerText = item.value+' €';

        const tdButtons = document.createElement("td");

        //bouton d'édition
        const editBtn = document.createElement("button");
        editBtn.innerText = 'Modif.';
        editBtn.classList.add('btn','btn-outline-warning','mx-2');
        //édition de l'élément
        editBtn.addEventListener('click', () => {
            //demande de création de la vue édition
            ipcRenderer.send('open-edit-item-window',{
                id: item.id,
                type: tbodyId.split('-')[0]
            });
            //si le channel est déjà ouvert, on le ferme
            if(cbEditedItem){
                ipcRenderer.removeListener("edited-item",cbEditedItem);
                cbEditedItem = null;
            }
            //callback d'édition
            cbEditedItem = (e,data)=>{
                tdLabel.innerText = data.item.label;
                tdValue.innerText = data.item.value+ " €";
                updateBalanceSheet(data.expenses,data.profits)
            };
            ipcRenderer.on("edited-item",cbEditedItem);
        })

        //bouton de suppression
        const deleteBtn = document.createElement("button");
        deleteBtn.innerText = 'Suppr.';
        deleteBtn.classList.add('btn','btn-outline-danger','mx-2');
        //suppression de l'élément
        deleteBtn.addEventListener('click', () => {
            //demande d'affichage de la pop-up de suppression
            ipcRenderer.invoke('show-confirm-delete-item',{
                id: item.id,
                type: tbodyId.split('-')[0]
            })
                //suppression de la ligne
                .then(resp=>{
                if(resp.choice){
                    tr.remove();
                    updateBalanceSheet(resp.expenses,resp.profits);
                }
            });
        })


        tdButtons.append(editBtn,deleteBtn);
        tr.append(thId,tdLabel,tdValue,tdButtons);
        tbody.append(tr);

    })
}

/**
 * mise à jour du budget
 * @param expenses dépenses
 * @param profits profits
 */
function updateBalanceSheet(expenses,profits){
    let sumExpenses = 0;
    expenses.forEach(elem=>{
        sumExpenses +=parseFloat(elem.value) || 0
    });

    const sumProfits =  profits.reduce((sum,elem)=>{return sum+=parseFloat(elem.value) || 0},0);

    const balance = sumProfits - sumExpenses;

    const balanceDiv = document.querySelector("#balance-sheet");
    balanceDiv.innerText = `${balance} €`;
    balanceDiv.classList.remove("bg-success","bg-danger","bg-warning");

    if (balance > 0){
        balanceDiv.classList.add("bg-success");

    }else if(balance < 0){
        balanceDiv.classList.add("bg-danger");
    }else{
        balanceDiv.classList.add("bg-warning");
    }

}

//initialisation
ipcRenderer.on("init-data",(e,data)=>{

    generateRowLine('profits-table',data.profits);
    generateRowLine('expenses-table',data.expenses);
    updateBalanceSheet(data.expenses,data.profits);

})

//bouton d'ajout
function onClickAddNewItem(e){
    ipcRenderer.send("open-new-item-window", {
        type: e.target.id.split("-")[1]
    });
}
document.querySelector("#add-expense").addEventListener("click",onClickAddNewItem);
document.querySelector("#add-profit").addEventListener("click",onClickAddNewItem);

//ajout d'un élément
ipcRenderer.on("new-item-added",(e,data)=>{
    generateRowLine(`${data.type}s-table`,data.item);
    updateBalanceSheet(data.expenses,data.profits);
    }
)