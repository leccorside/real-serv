
const http = require('http');

const url = 'http://localhost:3001/Handlers/PontoHandler_vFinal.ashx';

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Resposta do Handler:', data.substring(0, 500));
    });
}).on('error', (err) => {
    console.error('Erro:', err.message);
});
