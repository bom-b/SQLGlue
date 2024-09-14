const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// 데이터 저장 함수
function saveData(data) {
    const filePath = path.join(app.getPath('userData'), 'conf.json'); // 사용자 데이터 경로
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8'); // JSON 형식으로 저장
}

// 데이터 불러오기 함수
function loadData() {
    const filePath = path.join(app.getPath('userData'), 'conf.json');
    if (fs.existsSync(filePath)) { // 파일이 존재하는 경우
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data); // JSON 형식으로 파싱하여 반환
    }

    // 파일이 없으면 기본 설정으로 conf.json 파일 생성
    const defaultData = { alarm: true, shortcut: "Ctrl+Q", query: "Preparing:", param: "Parameters:" };
    saveData(defaultData); // 기본 데이터를 저장
    return defaultData; // 기본 설정 반환
}

// 모듈 내보내기
module.exports = {
    saveData,
    loadData
};