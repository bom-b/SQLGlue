const { app, BrowserWindow, Tray, Menu, ipcMain, clipboard, globalShortcut, Notification  } = require('electron');
const path = require('path');
const dataHandler = require('./public/javascripts/module/dataHandler.js'); // dataHandler 모듈 가져오기

let tray = null; // 트레이 변수
let win = null; // 브라우저 창 변수

// 클립보드 내용 저장 변수
let lastClipboardContent = '';

// 백그라운드에서 자동 변환 수행 여부
let autoConvert = true;

// 환경설정
let currentShortcut = ''; //단축키
let alarm;
let query;
let param;

if (process.env.NODE_ENV === 'dev') {
    const electronReload = require('electron-reload');
    electronReload(path.join(process.cwd()), {
        electron: path.join(process.cwd(), 'node_modules', '.bin', 'electron')
    });
}

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,  // 최소 너비 설정
        minHeight: 600, // 최소 높이 설정
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        frame: false
    });

    win.loadFile('index.html'); // index.html 파일을 로드
    win.setTitle('SQLGlue');

    // 개발자도구
    //win.webContents.openDevTools();

    // 창이 닫힐 때 숨기기
    win.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            win.hide();
        }
    });
}

// Single Instance 설정
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    // 이미 실행 중인 경우
    app.quit();
} else {
    // 첫 번째 인스턴스가 실행될 때
    app.whenReady().then(() => {
        createWindow();

        // 트레이 아이콘 생성
        tray = new Tray(path.join(__dirname, 'tray.ico')); // 트레이 아이콘을 설정 (아이콘 경로 수정 필요)

        const contextMenu = Menu.buildFromTemplate([
            {
                label: '열기', click: () => {
                    if (!win) {
                        createWindow(); // 창이 없으면 생성
                    }
                    win.show(); // 창을 표시
                }
            },
            {
                label: '자동 변환',
                type: 'checkbox',
                checked: autoConvert,
                click: (menuItem) => {
                    autoConvert = menuItem.checked;
                }
            },
            {
                type: 'separator'
            },
            {
                label: '종료', click: () => {
                    app.isQuiting = true; // 종료 플래그 설정
                    app.quit(); // 애플리케이션 종료
                }
            }
        ]);

        tray.setToolTip('SQLGlue'); // 툴팁 설정
        tray.setContextMenu(contextMenu); // 컨텍스트 메뉴 설정

        // 트레이 아이콘 클릭 시 창 보여주기
        tray.on('click', () => {
            win.isVisible() ? win.hide() : win.show(); // 창 보이기/숨기기
        });

        // 환경설정 불러오기
        currentShortcut = dataHandler.loadData().shortcut;
        alarm = dataHandler.loadData().alarm;
        query = dataHandler.loadData().query;
        param = dataHandler.loadData().param;

        if (currentShortcut.length > 0) {
            globalShortcut.register(currentShortcut, () => {
                win.isVisible() ? win.hide() : win.show();
            });
        }

        // 개발자도구 방지
        globalShortcut.register('Control+Shift+I', () => {
            // Do nothing
        });

        // 클립보드 체크
        setInterval(() => {

            if (!win || !autoConvert) return;

            const currentClipboardContent = clipboard.readText(); // 클립보드에서 텍스트 읽기
            if (currentClipboardContent !== lastClipboardContent) {
                lastClipboardContent = currentClipboardContent;
                win.webContents.send('clipboard-changed', currentClipboardContent); // 렌더러 프로세스에 변경된 내용 전송
            }
        }, 50); // 0.05초마다 검사

    });

    // 다른 인스턴스가 실행될 때
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // 이미 실행 중인 창을 포커스합니다.
        if (win) {
            if (win.isMinimized()) win.restore();
            win.focus();
        }
    });

    // 어플리케이션 종료
    app.on('will-quit', () => {
        globalShortcut.unregisterAll(); // 모든 단축키 등록 해제
    });

    // 모든 창이 닫힐 때 애플리케이션 종료
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    // 활성화 이벤트 (macOS)
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

}



// 트레이 최소화 제어
ipcMain.on('minimize-to-tray', (event) => {
    win.hide(); // 창을 숨김
});

ipcMain.on('save-data', (event, data) => {
    dataHandler.saveData(data); // 데이터를 저장

    // 이전 단축키가 등록되어 있으면 해제
    if (currentShortcut) {
        globalShortcut.unregister(currentShortcut);
    }

    // 새로운 단축키 등록
    if(data.shortcut.length > 0) {
        globalShortcut.register(data.shortcut, () => {
            win.isVisible() ? win.hide() : win.show();
        });
    }

    // 현재 단축키 업데이트
    currentShortcut = data.shortcut;

    // 전역 환경 설정 변수 업데이트
    alarm = data.alarm;
    query = data.query;
    param = data.param;

});

ipcMain.on('load-data', (event) => {
    const data = dataHandler.loadData(); // 데이터를 불러옴
    event.reply('data-loaded', data); // 렌더러 프로세스로 데이터 전송
});


// 전역 환경 변수 불러오기
ipcMain.on('request-globalVal', (event) => {
    event.sender.send('alarm', alarm);
    event.sender.send('query', query);
    event.sender.send('param', param);
});

ipcMain.on('copy-to-clipboard', (event, text) => {
    clipboard.writeText(text);
});

ipcMain.on('show-notification', (event, title, body) => {
    if(alarm) {
        const notification = new Notification({
            title: title,
            body: body,
            icon: path.join(__dirname, 'icon.ico') // 아이콘 경로 확인
        });
        notification.show();
    }
});