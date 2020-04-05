const { app, Menu, BrowserWindow, ipcMain,dialog} = require('electron');
const fs = require('fs');
let mainWindow;
let setConfigWindow;
let config;
let currentconfig;
let maxHeight = 700;
let defaultWidth = 450,defaultHeight = 450;
let targetcolumns = false;
let defaultconfigpath = "./config.json";
// SET ENV
process.env.NODE_ENV = 'production';
// const {dialog} = require('electron').remote;
//filename is a string containing the path and 
app.on('ready',  function() {
    console.log("window created!");
    mainWindow = new BrowserWindow({
        // width: 450,
        // height: 420,
        'title':'Fenetre principale',
        width: defaultWidth,
        height: defaultHeight,
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.on('close', function () {
        app.quit();
        process.exit();
    });
    mainWindow.loadFile('main.html');
    const menu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(menu);
    //EVENTS
    ipcMain.on('confignotset:add', function (event, item) {
        createSetConfigWindow();
        
    });
    ipcMain.on('configchange:add', function (event, item) {
        currentconfig = item;
        targetcolumns = false;
        mainWindow.setSize(defaultWidth, defaultHeight);

        
    });
    ipcMain.on('columnscount:add', function (event, item) {
        let height = 500 + (item / 2) * 50;
        if(height > maxHeight) height = maxHeight;
        mainWindow.setSize(defaultWidth, height);
        
    });
    ipcMain.on('targetcolumns:add', function (event, item) {
        console.log('TARGETCOLUMNS');
        targetcolumns = item;
        currentconfig.columnsMap = targetcolumns;
        console.log(targetcolumns);
        
    });
    ipcMain.on('configset:add', function (event, item) {
        
        currentconfig = item;
        targetcolumns= false;
        mainWindow.webContents.send('configchange:add',currentconfig);
        setConfigWindow.close();
        mainWindow.setSize(defaultWidth, defaultHeight);
    })
    
});
let mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Exit',
                accelerator: 'CmdOrCtrl+W',
                click() {
                    app.quit();
                }
            }
        ]
    },
    {
        label: "Configuration",
        submenu: [
            {
                label: 'Nouvelle configuration',
                click(){
                    createSetConfigWindow();
                }

            },
            // {
            //     label:"output configuration",
            //     click(){
            //         console.log("Default conf : \n" +JSON.stringify(currentconfig));
            //     }
            // },
            {
                label: 'Charger configuration',
                click() {
                    dialog.showOpenDialog({
                        defaultPath:".",
                        properties: ['openFile'],
                            filters: [
                                { name: 'JSON', extensions: ['json'] },
                             
                            ],
                    },function(filenames){
                            if (filenames === undefined) {
                                console.log("No files selected");
                                return;
                            }

                        fs.readFile(filenames[0],function(err,buf){
                            if(err){
                                showMessage("error","Error reading file","Couldn't read the selected file",String(err));
                                return;
                            }
                            console.log("FILE READ!!");
                            try {
                                config = JSON.parse(buf.toString());
                            } catch (error) {
                                showMessage("error","Error reading file","The selected file is not a proper config file",String(error));
                                
                                return;
                            }
                            if(verifyJson(config))
                                {currentconfig = config;
                                mainWindow.webContents.send('configchange:add', currentconfig);
                                mainWindow.setSize(defaultWidth,defaultHeight);
                                }
                                else {
                                    showMessage("error","Unknown configuration","The selected file doesnt contain a proper configuration","");
                                }
                            
                        });
                    });
                }
            },
            {
                label: "Exporter configuration",
                click() {
                    if (currentconfig != false) {
                        let savePath = dialog.showSaveDialog({
                            filters: [
                                { name: 'fichiers json', extensions: ['json'] },

                            ]
                        });
                        if(savePath == undefined) return;
                        
                        if (targetcolumns != false) currentconfig.mapColumns = true;
                        fs.writeFile(savePath, JSON.stringify(currentconfig), function (err) {
                            if (err) {
                                showMessage("warning", "Error occured", "An error occured while trying to override the default configuration", String(err));
                                return;
                            }
                            console.log("Current config saved!");
                        });

                        console.log(savePath);
                    }
                    else {
                        showMessage("error", "Set as default", "No configuration detected!", "Please set or load a configuration first!");
                    }
                }
            },
            {
                label:"Définir par défaut",
                click(){
                    if (currentconfig != false ) {
                        if (targetcolumns != false) currentconfig.mapColumns = true;
                        fs.writeFile("./config.json", JSON.stringify(currentconfig), function (err) {
                            if (err) {
                                showMessage("warning","Error occured","An error occured while trying to override the default configuration",String(err));
                                return;
                            }
                            console.log("CONFIG OVERWRITTEN!");
                        });
                    }
                    else {
                        showMessage("error","Set as default","No configuration detected!","Please set or load a configuration first!");
                                        }
                }
            },
            
        ]
    }
]
if (process.platform == 'darwin')
    mainMenuTemplate.unshift({});
if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developper tools',
        submenu: [
            {
                label: "Toggle Developper tools",
                accelerator: 'CmdOrCtrl+I',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            },
            {
                label: 'Rafraishir',
                role: 'reload'
            }
        ]
    })
}
// functions ////////////////////
function createSetConfigWindow() {
    setConfigWindow = new BrowserWindow({
        width: 400,
        height: 540,
        title: 'Set configuration',
        webPreferences: {
            nodeIntegration: true
        }
    })
    setConfigWindow.loadFile('setconfiguration.html');
    setConfigWindow.on('close', () => {
        setConfigWindow = null;
    });
}
function verifyJson(json) {
    if (json.host === undefined) return false;
    if (json.user === undefined) return false;
    if (json.password === undefined) return false;
    if (json.database === undefined) return false;
    if (json.tablename === undefined) return false;
    // if(json.)
    return true;
};
function showMessage(type, title, message, detail) {
    dialog.showMessageBox({
        type: type,
        buttons: [],
        title: title,
        message: message,
        detail: detail
    });
}