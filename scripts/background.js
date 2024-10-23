// Variáveis para armazenar dados por aba
let conexoesPorAba = {};  // Armazena conexões de terceiros por aba
let servicosDetectados = {};  // Armazena serviços suspeitos detectados
let dadosDeCookies = {};  // Armazena dados dos cookies (primeira e terceira parte)
let dadosDeArmazenamento = {};  // Armazena dados de LocalStorage e SessionStorage

// Constante com mapeamento de portas conhecidas para serviços
const portasConhecidas = {  
    "21": "FTP",
    "22": "SSH",
    "23": "Telnet",
    "25": "SMTP",
    "53": "DNS",
    "110": "POP3",
    "143": "IMAP",
    "3306": "MySQL",
    "3389": "RDP",
    "5900": "VNC",
    "8080": "HTTP Alternativa",
    "8443": "HTTPS Alternativa"
};

// Intercepta requisições web e detecta conexões e serviços
browser.webRequest.onBeforeRequest.addListener(
    function (detalhes) {
        // Verifica se a requisição é de um domínio de terceiro (não é o mesmo domínio de origem)
        if (detalhes.tabId !== -1 && detalhes.originUrl && new URL(detalhes.url).hostname !== new URL(detalhes.originUrl).hostname) {
            if (!conexoesPorAba[detalhes.tabId]) {
                conexoesPorAba[detalhes.tabId] = {};
            }
            conexoesPorAba[detalhes.tabId][detalhes.url] = (conexoesPorAba[detalhes.tabId][detalhes.url] || 0) + 1;  // Incrementa o contador de conexões
        }

        // Processa a URL para obter a porta utilizada
        let infoUrl = new URL(detalhes.url);
        let numeroPorta = infoUrl.port || (infoUrl.protocol === 'https:' ? '443' : '80');

        // Detecta se a conexão está utilizando uma porta não convencional
        if (numeroPorta !== '80' && numeroPorta !== '443') {
            let servicoDetectado = portasConhecidas[numeroPorta] || `Serviço desconhecido na porta ${numeroPorta}`;
            let detalheServico = `${servicoDetectado} em ${infoUrl.hostname}:${numeroPorta}`;
            if (!servicosDetectados[detalhes.tabId]) {
                servicosDetectados[detalhes.tabId] = {};
            }
            servicosDetectados[detalhes.tabId][detalheServico] = (servicosDetectados[detalhes.tabId][detalheServico] || 0) + 1;
            alert(`Serviço suspeito identificado: ${detalheServico}`);
        }
    },
    { urls: ["<all_urls>"] },  // Escuta todas as URLs
    ["blocking"]  // Intercepta as requisições para análise
);

// Intercepta os cabeçalhos das respostas para capturar dados de cookies
browser.webRequest.onHeadersReceived.addListener(
    function (detalhes) {
        if (detalhes.tabId !== -1) {
            const url = new URL(detalhes.url);
            const isThirdParty = detalhes.initiator && !detalhes.initiator.endsWith(url.hostname);  // Verifica se o cookie é de terceira parte
            const tipoCookie = isThirdParty ? 'thirdParty' : 'firstParty';  // Define se o cookie é de primeira ou terceira parte
            const tipoDetalhesCookie = isThirdParty ? 'thirdPartyDetails' : 'firstPartyDetails';  // Define o tipo de detalhes de cookie

            if (!dadosDeCookies[detalhes.tabId]) {
                dadosDeCookies[detalhes.tabId] = {
                    firstParty: 0,
                    thirdParty: 0,
                    firstPartyDetails: {},
                    thirdPartyDetails: {}
                };
            }

            // Processa os cabeçalhos da resposta para capturar o nome e o valor dos cookies
            detalhes.responseHeaders.forEach(header => {
                if (header.name.toLowerCase() === 'set-cookie') {
                    let nomeCookie = header.value.split('=')[0].trim();
                    dadosDeCookies[detalhes.tabId][tipoCookie]++;
                    if (dadosDeCookies[detalhes.tabId][tipoDetalhesCookie][nomeCookie]) {
                        dadosDeCookies[detalhes.tabId][tipoDetalhesCookie][nomeCookie]++;
                    } else {
                        dadosDeCookies[detalhes.tabId][tipoDetalhesCookie][nomeCookie] = 1;
                    }
                }
            });
        }
    },
    { urls: ["<all_urls>"] },  // Escuta todas as URLs
    ["responseHeaders"]  // Escuta os cabeçalhos da resposta
);

// Manipula mensagens de comunicação interna da extensão
browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    let idAba = sender.tab ? sender.tab.id : request.tabId;  // Obtém o ID da aba

    switch (request.action) {
        case "get_connections":
            let dadosConexoes = conexoesPorAba[idAba] ? conexoesPorAba[idAba] : {};
            sendResponse({ connections: dadosConexoes });  // Responde com os dados das conexões
            break;
        case "get_suspicious_services":
            let dadosServicos = servicosDetectados[idAba] ? servicosDetectados[idAba] : {};
            sendResponse({ services: dadosServicos });  // Responde com os serviços suspeitos detectados
            break;
        case "get_cookies":
            let dadosCookies = dadosDeCookies[idAba] || { firstParty: 0, thirdParty: 0, firstPartyDetails: {}, thirdPartyDetails: {} };
            sendResponse({ cookies: dadosCookies });  // Responde com os dados de cookies
            console.log(`Enviando dados de cookies para aba ${idAba}:`, dadosCookies);
            break;
        case "get_local_storage":
            browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
                if (tabs.length > 0) {
                    capturarLocalStorage(tabs[0].id, sendResponse);  // Chama a função para capturar o LocalStorage da aba
                } else {
                    sendResponse({ error: "Nenhuma aba ativa encontrada" });
                }
            });
            break;
        default:
            console.log("Ação desconhecida:", request.action);
            break;
    }
    return true;  // Necessário para manter o canal de resposta aberto
});

// Função para limpar os dados ao fechar uma aba
browser.tabs.onRemoved.addListener(function (tabId) {
    delete conexoesPorAba[tabId];
    delete servicosDetectados[tabId];
    delete dadosDeCookies[tabId];
    delete dadosDeArmazenamento[tabId];
});

// Função para resetar os dados ao recarregar uma aba
browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === "loading") {  // Verifica se a aba está sendo recarregada
        conexoesPorAba[tabId] = {};
        servicosDetectados[tabId] = {};
        dadosDeCookies[tabId] = { firstParty: 0, thirdParty: 0, firstPartyDetails: {}, thirdPartyDetails: {} };
        dadosDeArmazenamento[tabId] = {};
    }
});

// Função para obter os dados de cookies de uma aba
function obterCookiesPorAba(tabId) {
    let detalhes = dadosDeCookies[tabId];
    if (detalhes) {
        return { firstPartyDetails: detalhes.firstParty, thirdPartyDetails: detalhes.thirdParty };
    }
    return { firstPartyDetails: {}, thirdPartyDetails: {} };
}

// Função para capturar dados do LocalStorage
function capturarLocalStorage(tabId, sendResponse) {
    browser.tabs.executeScript(tabId, {
        code: `
            JSON.stringify({
                localStorageCount: Object.keys(localStorage).length,
                sessionStorageCount: Object.keys(sessionStorage).length,
                localStorage: Object.entries(localStorage).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
                sessionStorage: Object.entries(sessionStorage).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
            });
        `
    }).then(results => {
        if (results && results[0]) {
            const data = JSON.parse(results[0]);
            sendResponse({ data: data });  // Envia os dados do LocalStorage e SessionStorage para a aba solicitante
        } else {
            sendResponse({ error: "Nenhum dado recebido" });
        }
    }).catch(error => {
        console.error(`Erro ao executar script na aba ${tabId}:`, error);  // Log de erro caso haja problemas ao executar o script
        sendResponse({ error: error.message });
    });
    return true;  // Mantém o canal de comunicação aberto até o final do processo
}
