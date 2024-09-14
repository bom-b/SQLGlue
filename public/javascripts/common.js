const { ipcRenderer } = require('electron');
const sqlFormatterPlus = require("sql-formatter-plus");

const gearIcon = document.getElementById('gearIcon');
if (gearIcon) {
    // 마우스 오버 이벤트 처리
    gearIcon.addEventListener('mouseover', () => {
        gearIcon.src = './public/icons/gear-org.svg'; // 색깔이 다른 이미지로 변경
    });

    // 마우스 아웃 이벤트 처리
    gearIcon.addEventListener('mouseout', () => {
        gearIcon.src = './public/icons/gear-wht.svg'; // 원래 이미지로 변경
    });
}


const closeIcon = document.getElementById('closeIcon');
if (closeIcon) {
    // 마우스 오버 이벤트 처리
    closeIcon.addEventListener('mouseover', () => {
        closeIcon.src = './public/icons/x-org.svg'; // 색깔이 다른 이미지로 변경
    });

    // 마우스 아웃 이벤트 처리
    closeIcon.addEventListener('mouseout', () => {
        closeIcon.src = './public/icons/x-wht.svg'; // 원래 이미지로 변경
    });

    // 클릭 이벤트 처리하여 트레이로 최소화
    closeIcon.addEventListener('click', () => {
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('minimize-to-tray'); // 메인 프로세스에 최소화 요청
    });
}
