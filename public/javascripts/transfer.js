const message = document.getElementById('message');

function transformText() {

    let query = "";
    let param = "";

    function requestGlobalVars() {
        return new Promise((resolve) => {
            let responses = 0;

            ipcRenderer.send('request-globalVal');

            ipcRenderer.on('query', (event, newQuery) => {
                query = newQuery;
                responses++;
                checkCompletion();
            });

            ipcRenderer.on('param', (event, newParam) => {
                param = newParam;
                responses++;
                checkCompletion();
            });

            function checkCompletion() {
                if (responses === 2) { // 총 3개의 응답을 기다림
                    resolve(); // 모든 응답이 완료되면 resolve 호출
                }
            }
        });
    }

    const textarea = document.getElementById('origin');
    const originText = textarea.value;
    requestGlobalVars().then(() => {

        if (originText.includes(query) && originText.includes(param)) {

            try {
                const queryRegex = new RegExp(`${query}(.+)`, 'i');
                const paramRegex = new RegExp(`${param}(.+)`, 'i');

                let queryText = originText.match(queryRegex)[1].trim();
                const paramsMatch = originText.match(paramRegex)[1];
                const paramsArray = paramsMatch.split(',').map(param => param.replace(/\s*\(.*?\)\s*/, '').trim());
                // ?에 해당하는 파라미터로 치환

                paramsArray.forEach(param => {
                    // 여기서 파라미터 값을 따옴표로 둘러싸서 치환
                    queryText = queryText.replace('?', `'${param}'`);
                });

                try {
                    const formattedQuery = sqlFormatterPlus.format(queryText, {
                        language: 'sql',
                        useTabs: true,
                        tabSize: 4,
                        uppercase: true,
                        commaSpacing: true
                    });
                    // 클립보드에 포맷된 쿼리 복사
                    ipcRenderer.send('copy-to-clipboard', formattedQuery);
                } catch (error) {
                    // 주석으로 인해 포매팅이 안된경우
                    ipcRenderer.send('copy-to-clipboard', queryText);
                }

                textarea.style.boxShadow = '0 0 0 0.2rem rgba(0, 100, 0, 0.35)';
                message.textContent = "변환된 쿼리가 클립보드에 저장되었습니다.";
                message.className = '';
                message.classList.add('darkgreen');
                setTimeout(() => {
                    textarea.style.boxShadow = '';
                }, 1000);

            } catch (error) {
                textarea.style.boxShadow = '0 0 0 0.2rem rgba(198, 62, 33, 0.35)';
                message.textContent = "변환중 오류가 발생하였습니다.";
                message.className = '';
                message.classList.add('darkred');
                setTimeout(() => {
                    textarea.style.boxShadow = '';
                }, 1000);
            }

        } else {
            textarea.style.boxShadow = '0 0 0 0.2rem rgba(198, 62, 33, 0.35)';
            message.textContent = "쿼리와 파라미터를 찾을 수 없습니다.";
            message.className = '';
            message.classList.add('darkred');
            setTimeout(() => {
                textarea.style.boxShadow = '';
            }, 1000);
        }
    });
}

function clearText() {
    document.getElementById('origin').value = "";
}