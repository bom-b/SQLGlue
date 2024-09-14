

// 클립보드 내용 변경 이벤트 수신
ipcRenderer.on('clipboard-changed', (event, newContent) => {

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

    requestGlobalVars().then(() => {

        if(newContent.includes(query) && newContent.includes(param)) {

            try {
                const queryRegex = new RegExp(`${query}(.+)`, 'i');
                const paramRegex = new RegExp(`${param}(.+)`, 'i');

                let queryText = newContent.match(queryRegex)[1].trim();
                const paramsMatch = newContent.match(paramRegex)[1];
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

                ipcRenderer.send('show-notification', "변환 완료", '클립보드에 저장되었습니다.');

            } catch (error) {
                ipcRenderer.send('show-notification', "오류발생!", '변환 중 오류발생');
            }

        }
    });
});