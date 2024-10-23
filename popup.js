document.addEventListener('DOMContentLoaded', function () {
    // Seleciona os elementos HTML relacionados a contagem de conexões de terceiros
    const divContagemConexoes = document.getElementById('connectionsCount');
    const botaoAlternarConexoes = document.getElementById('toggleConnectionsButton');
    const dropdownConexoes = document.getElementById('connectionsDropdown');
    const resultadosConexoes = document.getElementById('connectionsResults');

    // Seleciona os elementos HTML relacionados a serviços suspeitos
    const divContagemServicos = document.getElementById('servicesCount');
    const botaoAlternarServicos = document.getElementById('toggleServicesButton');
    const dropdownServicos = document.getElementById('servicesDropdown');
    const resultadosServicos = document.getElementById('servicesResults');

    // Seleciona os elementos HTML relacionados aos cookies de primeira parte
    const divContagemCookies = document.getElementById('cookiesCount');
    const botaoAlternarCookies = document.getElementById('toggleCookiesButton');
    const dropdownCookies = document.getElementById('cookiesDropdown');
    const resultadosCookies = document.getElementById('cookiesResults');

    // Seleciona os elementos HTML relacionados aos cookies de terceira parte
    const divContagemCookies3 = document.getElementById('cookiesCount3');
    const botaoAlternarCookies3 = document.getElementById('toggleCookiesButton3');
    const dropdownCookies3 = document.getElementById('cookiesDropdown3');
    const resultadosCookies3 = document.getElementById('cookiesResults3');

    // Seleciona os elementos HTML relacionados ao armazenamento local
    const divContagemArmazenamentoLocal = document.getElementById('localStorageCount');
    const botaoAlternarArmazenamentoLocal = document.getElementById('toggleLocalStorageButton');
    const dropdownArmazenamentoLocal = document.getElementById('localStorageDropdown');
    const resultadosArmazenamentoLocal = document.getElementById('localStorageResults');

    // Seleciona os elementos HTML relacionados ao armazenamento de sessão
    const divContagemArmazenamentoSessao = document.getElementById('sessionStorageCount');
    const botaoAlternarArmazenamentoSessao = document.getElementById('toggleSessionStorageButton');
    const dropdownArmazenamentoSessao = document.getElementById('sessionStorageDropdown');
    const resultadosArmazenamentoSessao = document.getElementById('sessionStorageResults');

    // Elemento HTML para exibir a pontuação de vulnerabilidade final
    const pontuacaoSite = document.getElementById('scoreSite');

    // Consulta a aba ativa no navegador e chama as funções para buscar dados (conexões, serviços, cookies, etc.)
    browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const idAbaAtual = tabs[0].id; // Obtém o ID da aba ativa
        buscarConexoes(idAbaAtual); // Busca conexões de terceiros
        buscarServicos(idAbaAtual); // Busca serviços suspeitos
        buscarCookies(idAbaAtual); // Busca cookies
        buscarArmazenamentoLocal(idAbaAtual); // Busca dados de armazenamento local e de sessão
        calcularPontuacao(); // Calcula a pontuação com base nos dados coletados
    });

    // Função para calcular a pontuação de vulnerabilidade com base nos dados coletados
    function calcularPontuacao() {
        let pontuacaoConexoes = 0;
        let pontuacaoServicos = 0;
        let pontuacaoCookies = 0;
        let pontuacaoCookies3 = 0;
        let pontuacaoArmazenamentoLocal = 0;
        let pontuacaoArmazenamentoSessao = 0;

        // Calcula a pontuação para cada tipo de dado com base no número de itens
        pontuacaoConexoes = resultadosConexoes.children.length * 0.15;
        pontuacaoServicos = resultadosServicos.children.length * 0.3;
        pontuacaoCookies = resultadosCookies.children.length * 0.1;
        pontuacaoCookies3 = resultadosCookies3.children.length * 0.3;
        pontuacaoArmazenamentoLocal = resultadosArmazenamentoLocal.children.length * 0.2;
        pontuacaoArmazenamentoSessao = resultadosArmazenamentoSessao.children.length * 0.2;

        // Soma todas as pontuações individuais para obter a pontuação final
        let pontuacaoFinal = pontuacaoConexoes + pontuacaoServicos + pontuacaoCookies + pontuacaoCookies3 + pontuacaoArmazenamentoLocal + pontuacaoArmazenamentoSessao;
        console.log(`pontuacaoConexoes: ${pontuacaoConexoes}, pontuacaoServicos: ${pontuacaoServicos}, pontuacaoCookies: ${pontuacaoCookies}, pontuacaoCookies3: ${pontuacaoCookies3}, pontuacaoArmazenamentoLocal: ${pontuacaoArmazenamentoLocal}, pontuacaoArmazenamentoSessao: ${pontuacaoArmazenamentoSessao}, pontuacaoFinal: ${pontuacaoFinal}`);

        // Limita a pontuação máxima a 10
        if (pontuacaoFinal > 10) {
            pontuacaoFinal = 10;
        }

        // Exibe a pontuação final no elemento HTML
        pontuacaoSite.textContent = `Pontuação de Vulnerabilidade: ${pontuacaoFinal.toFixed(2)}`;
    }

    // Adiciona eventos para recalcular a pontuação sempre que houver mudanças nos dados
    resultadosConexoes.addEventListener('DOMSubtreeModified', calcularPontuacao);
    resultadosServicos.addEventListener('DOMSubtreeModified', calcularPontuacao);
    resultadosCookies.addEventListener('DOMSubtreeModified', calcularPontuacao);
    resultadosCookies3.addEventListener('DOMSubtreeModified', calcularPontuacao);
    resultadosArmazenamentoLocal.addEventListener('DOMSubtreeModified', calcularPontuacao);
    resultadosArmazenamentoSessao.addEventListener('DOMSubtreeModified', calcularPontuacao);

    // Função para buscar as conexões de terceiros da aba ativa
    function buscarConexoes(idAba) {
        browser.runtime.sendMessage({ action: "get_connections", tabId: idAba }, function (response) {
            if (response && response.connections && Object.keys(response.connections).length > 0) {
                divContagemConexoes.textContent = `Total de conexões de terceira parte: ${Object.keys(response.connections).length}`;
                botaoAlternarConexoes.style.display = 'block';
                preencherLista(resultadosConexoes, response.connections, 'conexao');
            } else {
                divContagemConexoes.textContent = "Nenhuma conexão de terceira parte detectada.";
                botaoAlternarConexoes.style.display = 'none';
            }
        });
    }

    // Função para buscar os serviços suspeitos na aba ativa
    function buscarServicos(idAba) {
        browser.runtime.sendMessage({ action: "get_suspicious_services", tabId: idAba }, function (response) {
            if (response && response.services && Object.keys(response.services).length > 0) {
                divContagemServicos.textContent = `Total de serviços suspeitos: ${Object.keys(response.services).length}`;
                botaoAlternarServicos.style.display = 'block';
                preencherLista(resultadosServicos, response.services, 'servico');
            } else {
                divContagemServicos.textContent = "Nenhum serviço suspeito detectado.";
                botaoAlternarServicos.style.display = 'none';
            }
        });
    }

    // Função para buscar cookies de primeira e terceira parte na aba ativa
    function buscarCookies(idAba) {
        browser.runtime.sendMessage({ action: "get_cookies", tabId: idAba }, function (response) {
            if (response && response.cookies) {
                const detalhesPrimeiraParte = response.cookies.firstPartyDetails || {};
                const detalhesTerceiraParte = response.cookies.thirdPartyDetails || {};
                const primeiraParte = Object.keys(detalhesPrimeiraParte).length;
                const terceiraParte = Object.keys(detalhesTerceiraParte).length;
                
                // Atualiza as informações de cookies de primeira e terceira parte
                divContagemCookies.textContent = `Cookies de primeira parte: ${primeiraParte}`;
                divContagemCookies3.textContent = `Cookies de terceira parte: ${terceiraParte}`;
                
                // Exibe os resultados de cookies de primeira parte
                if (primeiraParte > 0) {
                    botaoAlternarCookies.style.display = 'block';
                    preencherLista(resultadosCookies, detalhesPrimeiraParte, 'cookie');
                } else {
                    botaoAlternarCookies.style.display = 'none';
                }
                
                // Exibe os resultados de cookies de terceira parte
                if (terceiraParte > 0) {
                    botaoAlternarCookies3.style.display = 'block';
                    preencherLista(resultadosCookies3, detalhesTerceiraParte, 'cookie');
                } else {
                    botaoAlternarCookies3.style.display = 'none';
                }
            } else {
                // Exibe mensagens padrão caso não haja cookies detectados
                divContagemCookies.textContent = "Nenhum cookie de primeira parte detectado.";
                divContagemCookies3.textContent = "Nenhum cookie de terceira parte detectado.";
                botaoAlternarCookies.style.display = 'none';
                botaoAlternarCookies3.style.display = 'none';
            }
        });
    }

    // Função para buscar dados de armazenamento local e de sessão na aba ativa
    function buscarArmazenamentoLocal(idAba) {
        browser.runtime.sendMessage({ action: "get_local_storage", tabId: idAba }, function (response) {
            if (!response) {
                console.error("Nenhuma resposta recebida");
                return;
            }
            if (response.error) {
                console.error("Erro ao buscar armazenamento:", response.error);
                return;
            }

            if (response.data) {
                const { localStorage, sessionStorage } = response.data;
                
                // Exibe os resultados do armazenamento local
                if (localStorage && Object.keys(localStorage).length > 0) {
                    divContagemArmazenamentoLocal.textContent = `Local Storage: ${Object.keys(localStorage).length}`;
                    botaoAlternarArmazenamentoLocal.style.display = 'block';
                    preencherLista(resultadosArmazenamentoLocal, localStorage, 'armazenamento');
                } else {
                    divContagemArmazenamentoLocal.textContent = "Nenhum armazenamento local detectado.";
                    botaoAlternarArmazenamentoLocal.style.display = 'none';
                }

                // Exibe os resultados do armazenamento de sessão
                if (sessionStorage && Object.keys(sessionStorage).length > 0) {
                    divContagemArmazenamentoSessao.textContent = `Session Storage: ${Object.keys(sessionStorage).length}`;
                    botaoAlternarArmazenamentoSessao.style.display = 'block';
                    preencherLista(resultadosArmazenamentoSessao, sessionStorage, 'armazenamento');
                } else {
                    divContagemArmazenamentoSessao.textContent = "Nenhum armazenamento de sessão detectado.";
                    botaoAlternarArmazenamentoSessao.style.display = 'none';
                }
            } else {
                // Exibe mensagens padrão caso não haja dados de armazenamento detectados
                divContagemArmazenamentoLocal.textContent = "Nenhum armazenamento local detectado.";	
                divContagemArmazenamentoSessao.textContent = "Nenhum armazenamento de sessão detectado.";
                botaoAlternarArmazenamentoLocal.style.display = 'none';
                botaoAlternarArmazenamentoSessao.style.display = 'none';
            }
        });
    }

    // Função para preencher a lista de resultados na interface com os dados coletados
    function preencherLista(elementoLista, itens, tipo) {
        elementoLista.innerHTML = ''; // Limpa a lista antes de preencher
        if (tipo === 'armazenamento') {
            // Se for tipo armazenamento, exibe a chave e o valor de cada item
            Object.entries(itens).forEach(([chave, valor]) => {
                let li = document.createElement('li');
                li.textContent = `${chave}: ${valor}`;
                elementoLista.appendChild(li);
            });
        } else {
            // Para outros tipos (como cookies ou conexões), exibe apenas a chave
            Object.keys(itens).forEach(chave => {
                let li = document.createElement('li');
                li.textContent = `${chave}`;
                elementoLista.appendChild(li);
            });
        }
    }

    // Função para alternar a exibição dos dropdowns (mostrar/esconder)
    function alternarDropdown(dropdown, botao, textoMostrar, textoEsconder) {
        if (dropdown.style.display === 'block') {
            dropdown.style.display = 'none'; // Esconde o dropdown
            botao.textContent = textoMostrar; // Altera o texto do botão
        } else {
            dropdown.style.display = 'block'; // Mostra o dropdown
            botao.textContent = textoEsconder; // Altera o texto do botão
        }
    }

    // Eventos para alternar a exibição dos dropdowns de conexões, serviços, cookies e armazenamento
    botaoAlternarConexoes.addEventListener('click', () => {
        alternarDropdown(dropdownConexoes, botaoAlternarConexoes, 'Mostrar Conexões', 'Esconder Conexões');
    });

    botaoAlternarServicos.addEventListener('click', () => {
        alternarDropdown(dropdownServicos, botaoAlternarServicos, 'Mostrar Serviços Suspeitos', 'Esconder Serviços');
    });

    botaoAlternarCookies.addEventListener('click', () => {
        alternarDropdown(dropdownCookies, botaoAlternarCookies, 'Mostrar Cookies - 1 parte', 'Esconder Cookies - 1 parte');
    });

    botaoAlternarCookies3.addEventListener('click', () => {
        alternarDropdown(dropdownCookies3, botaoAlternarCookies3, 'Mostrar Cookies - 3 parte', 'Esconder Cookies - 3 parte');
    });

    botaoAlternarArmazenamentoLocal.addEventListener('click', () => {
        alternarDropdown(dropdownArmazenamentoLocal, botaoAlternarArmazenamentoLocal, 'Mostrar Armazenamento Local', 'Esconder Armazenamento Local');
    });

    botaoAlternarArmazenamentoSessao.addEventListener('click', () => {
        alternarDropdown(dropdownArmazenamentoSessao, botaoAlternarArmazenamentoSessao, 'Mostrar Armazenamento de Sessão', 'Esconder Armazenamento de Sessão');
    });
});
