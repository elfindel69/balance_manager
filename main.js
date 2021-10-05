const {app, BrowserWindow, ipcMain, dialog,Menu} = require('electron');
const path = require('path');
const Store = require('electron-store');

//fenêtres
let newItemWindow;
let homeWindow;
let editItemWindow;

//init tableaux
let expenses = null;
let profits = null;

//persistance en JSON
const store = new Store();
//tableau de dépenses
if(store.has("expenses")){
    expenses = store.get("expenses");
}else {
    expenses = [
        {
            id: 1,
            label: "Achat huile moteur",
            value: 80
        },
        {
            id: 2,
            label: "Achat joint vidange",
            value: 20
        },
        {
            id: 3,
            label: "Achat filtre à huile",
            value: 10
        }
    ];
    store.set("expenses",expenses);
}
//tableau de recettes
if(store.has("profits")){
    profits = store.get("profits");
}else{
    profits = [
        {
            id: 1,
            label: "Vidange voiture",
            value: 150
        }
    ];
    store.set("profits",profits);
}



/**
 * fonction de création de fenêtre
 * @param viewName titre de la fenêtre
 * @param dataToSend données à afficher
 * @param width largeur de la fenêtre (px)
 * @param height hauteur de la fenêtre (px)
 * @returns {Electron.CrossProcessExports.BrowserWindow} fenêtre créée
 */
function createWindow(viewName,dataToSend,width=1600,height=900) {
    //création de la fenêtre
    const win = new BrowserWindow({
        width, height,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    //ouverture du fichier HTML
    win.loadFile(path.join(__dirname, "views", viewName, viewName+".html")).then(() => {
        if(dataToSend){
            win.send('init-data', dataToSend);
        }
    });
    //ouverture de la fenêtre de débug
    win.webContents.openDevTools();
    //retour
    return win;
}

//création de la fenêtre
app.whenReady().then(()=>{
    console.log(app.getPath('userData'));
    const data = {expenses,profits};
    homeWindow = createWindow("home",data)
});

//suppression de l'application
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

//activation de la fenêtre
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        console.log(app.getPath('userData'));
        const data = {expenses,profits};
        homeWindow = createWindow("home",data)
    }
});


const openNewItemWindowCb= (e,data)=>{
    //si il y a une fenêtre, on l'affiche
    if(newItemWindow){
        newItemWindow.focus();
        return;
    }
    //création de la fenêtre
    newItemWindow = createWindow("new-item",null,1000,500);
    //retour sur le channel new-item
    ipcMain.handle('new-item',(e,newItem)=>{
        //ajout de l'item
        let id = 1;
        const selectedArray = (data.type === 'profit'?profits:expenses);
        if(selectedArray.length > 0){
            id = selectedArray[selectedArray.length - 1].id +1;
        }
        newItem.id = id;
        selectedArray.push(newItem);
        //stockage de l'item
        store.set(`${data.type}s`,selectedArray);
        //envoi de l'item à la vue principale
        homeWindow.send('new-item-added',{
            item: [newItem],
            type: data.type,
            expenses,
            profits
        });

        //message de retour
        return 'Item ajouté avec succès'
    });
    //suppression des channels
    newItemWindow.on('closed',()=>{
        newItemWindow = null;
        ipcMain.removeHandler('new-item');
    });
};
/**
 * channel d'ajout d'item
 */
ipcMain.on('open-new-item-window',openNewItemWindowCb)

/**
 * édition d'un item
 */
ipcMain.on('open-edit-item-window',(e,dataItem)=>{
    //si une fenêtre est ouverte on la ferme
    if(editItemWindow){
        editItemWindow.close();
    }

   //recherche de l'item
    const selectedTab = dataItem.type === 'expenses'?expenses:profits;
    for(let [index,item] of selectedTab.entries()){
        if(item.id === dataItem.id){
            //création de la fenêtre
            editItemWindow = createWindow("edit-item", {item},1000,500);
            //mise à jour de l'item
            ipcMain.handle('edit-item',(e,data)=>{
                selectedTab[index].label = data.label;
                selectedTab[index].value = data.value;

                store.set(dataItem.type,selectedTab);
                //mise à jour du front
                homeWindow.send('edited-item',{item:selectedTab[index],expenses,profits});
                //message de retour
                return 'item modifié avec succès';
            });
            //suppression des channels
            editItemWindow.on('closed',()=>{
                editItemWindow = null;
                ipcMain.removeHandler('edit-item');
            });
            break;
        }
    }
    //suppression des channels
    editItemWindow.on('closed',()=>{
        editItemWindow = null
    })


})

/**
* suppression d'un item
*/
ipcMain.handle("show-confirm-delete-item",(e,data)=>{
    //pop-up de confirmation
    const choice = dialog.showMessageBoxSync({
        type:"warning",
        buttons:['Non','Oui'],
        title:"Confirmation de suppression",
        message: "Êtes vous sûr de vouloir supprimer l'élément ?"
    });

    //si suppression confirmée
    if(choice){
        //recherche de l'élément
        const selectedTab = data.type === 'expenses'?expenses:profits;
       for(let [index,item] of selectedTab.entries()){
           if(item.id === data.id){
               //suppression de l'élément
               selectedTab.splice(index,1);
               store.set(data.type,selectedTab);
               break;
           }
       }
    }
    return {choice, expenses, profits}
})

//menu
const menuConfig = [
    {
        label: 'Action',
        submenu: [
            {
                label: 'Nouvelle dépense',
                accelerator: 'CmdOrCtrl+N',
                click() {
                    openNewItemWindowCb(null,{type:"expense"});
                }
            },
            {
                label: 'Nouvelle recette',
                accelerator: 'CmdOrCtrl+B',
                click() {
                    openNewItemWindowCb(null,{type:"profit"});
                }
            }
            ,
            {
                label: 'Activer/Désactiver le mode édition',
                accelerator: 'CmdOrCtrl+E',
                click() {
                    homeWindow.send('toggle-edition-mode');
                }
            }
        ]
    },
    {
        label: 'Fenêtre',
        submenu: [
            {role:"reload"},
            {role:"toggledevtools"},
            {type:"separator"},
            {role:"togglefullscreen"},
            {role:"minimize"},
            {type:"separator"},
            {role:"close"}
        ]
    }
];

const menu = Menu.buildFromTemplate(menuConfig);
Menu.setApplicationMenu(menu);
