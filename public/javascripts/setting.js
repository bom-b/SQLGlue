let alarm;
let shortcut;
let query;
let param;

const alarmButton = document.getElementById('toggleButton');
const shortcutField = document.getElementById('shortcut');
const message = document.getElementById('message');

// 설정 데이터 불러오기
ipcRenderer.send('load-data');
ipcRenderer.on('data-loaded', (event, data) => {
    alarm = data.alarm;
    shortcut = data.shortcut;
    query = data.query;
    param = data.param;

    // 불러온 기존 설정값 바인딩
    if(alarm) {
        alarmButton.textContent = 'ON';
        alarmButton.classList.remove('btn-gray');
        alarmButton.classList.add('btn-signature2');
    } else {
        alarmButton.textContent = 'OFF';
        alarmButton.classList.remove('btn-signature2');
        alarmButton.classList.add('btn-gray');
    }

    document.getElementById('shortcut').value = shortcut;
    document.getElementById('query').value = query;
    document.getElementById('param').value = param;
});

// 알림설정버튼 누를시
alarmButton.addEventListener('click', function() {
    const button = this;
    if (button.textContent === 'OFF') {
        button.textContent = 'ON';
        button.classList.remove('btn-gray');
        button.classList.add('btn-signature2');
        alarm = true;
    } else {
        button.textContent = 'OFF';
        button.classList.remove('btn-signature2');
        button.classList.add('btn-gray');
        alarm = false;
    }
});

// 단축키 설정
shortcutField.addEventListener('keydown', function(event) {
    event.preventDefault();
    shortcutField.value = "";

    let keys = [];

    // 수정 키가 눌렸는지 확인
    if (event.ctrlKey) keys.push('Ctrl');
    if (event.shiftKey) keys.push('Shift');
    if (event.altKey) keys.push('Alt');

    // 눌린 키 추가
    if (event.key !== 'Control' && event.key !== 'Shift' && event.key !== 'Alt') {
        if (/^[a-zA-Z]$/.test(event.key)) {
            keys.push(event.key.toUpperCase()); // 알파벳일 경우 대문자로 변환하여 추가
        } else {
            keys.push(event.key); // 알파벳이 아닌 경우 그대로 추가
        }
    }

    // 조합된 키 문자열 생성
    if (keys.length === 0) {
        shortcut = ""; // 아무 키도 눌리지 않은 경우
    } else if (keys.length === 1 && (event.ctrlKey || event.shiftKey || event.altKey)) {
        shortcut = ""; // 수정 키만 눌린 경우
    } else {
        shortcut = keys.join('+'); // 'Ctrl + Q'와 같은 형식으로 생성
    }

    // 입력 필드에 조합된 키 문자열 표시
    shortcutField.value = shortcut; // 입력 필드에 조합된 키 문자열 업데이트
});

// 설정 저장
function saveSetting() {
    const newShortcut = document.getElementById('shortcut').value;
    const newQuery = document.getElementById('query').value;
    const newParam = document.getElementById('param').value;
    if(newQuery.length < 1 || newParam.length < 1 ) {
        message.textContent = "인식 문자열을 한글자 이상 입력해주세요.";
        message.className = '';
        message.classList.add('darkred');
    } else {
        const newData = {alarm: alarm, shortcut: newShortcut, query: newQuery, param: newParam};
        ipcRenderer.send('save-data', newData);
        message.textContent = "설정을 저장하였습니다.";
        message.className = '';
        message.classList.add('darkgreen');
    }
}

