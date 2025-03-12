// Função para carregar operações
async function carregarOperacoes() {
    try {
        const response = await fetch('http://localhost:3000/trades');
        const operacoes = await response.json();
        preencherTabela(operacoes);
    } catch (error) {
        console.error('Erro ao carregar operações:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.navbar-toggler');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');

    // Toggle sidebar
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Fechar sidebar ao clicar no overlay
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        sidebarOverlay.style.display = 'none';
    });

    // Fechar sidebar ao redimensionar para desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 991.98) {
            sidebar.classList.remove('active');
            sidebarOverlay.style.display = 'none';
        }
    });

    // Inicialização do modal do formulário
    const modalTrade = new bootstrap.Modal(
        document.getElementById('modalTrade'), 
        {
            backdrop: 'static',
            keyboard: false
        }
    );

    // Abrir modal ao clicar no botão "Novo Trade"
    document.getElementById('btn-adicionar-trade').addEventListener('click', () => {
        modalTrade.show();
    });

});

function preencherTabela(operacoes) {
    const tbody = document.querySelector('#tabela-operacoes tbody');
    tbody.innerHTML = '';

    operacoes.forEach(operacao => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', operacao.id); // Adicione um ID único para cada operação
        tr.innerHTML = `
            <td>${operacao.data}</td>
            <td>${operacao.ativo}</td>
            <td class="hide-mobile">${operacao.evento}</td>
            <td class="hide-mobile">${operacao.localizacao}</td>
            <td>${operacao.resultado}</td>
            <td class="hide-mobile">${JSON.parse(operacao.erros).join(', ')}</td>
            <td>${operacao.observacao || ''}</td>
            <td>
                ${operacao.foto ? 
                    `<img src="${operacao.foto}" class="imagem-miniatura" onclick="mostrarImagem('${operacao.foto}')">` 
                    : 'Sem foto'}
            </td>
            <td>
                <button class="btn btn-danger btn-sm btn-excluir">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Adicione eventos de clique para os botões de exclusão
    document.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.closest('tr').dataset.id;
            // Salva o ID da operação no modal
            idTrade = id;
            const modalConfirmacao = new bootstrap.Modal(document.getElementById('modalConfirmacao'));
            modalConfirmacao.show();  // Exibe o modal de confirmação
        });
    });
}

// Função para mostrar imagem
window.mostrarImagem = function(src) {
    let modal = document.querySelector('.modal-imagem');
    if (!modal) {
        modal = document.createElement('div');
        modal.classList.add('modal-imagem');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.onclick = () => document.body.removeChild(modal);
    }

    const img = document.createElement('img');
    img.src = src;
    img.style.maxWidth = '90%';
    img.style.maxHeight = '90%';

    modal.innerHTML = ''; // Limpa o conteúdo antigo do modal
    modal.appendChild(img);
    document.body.appendChild(modal);
};

let idTrade = null;

// Evento para confirmar exclusão
document.getElementById('btn-confirmar-deletar').addEventListener('click', async function() {
    if (idTrade !== null) {
        try {
            const response = await fetch(`http://localhost:3000/trades/${idTrade}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                carregarOperacoes();  // Recarregar as operações após exclusão
                const modalConfirmacao = bootstrap.Modal.getInstance(document.getElementById('modalConfirmacao'));
                modalConfirmacao.hide();  // Fechar o modal
                idTrade = null;  // Limpar idTrade após exclusão
            } else {
                alert('Erro ao excluir operação');
            }
        } catch (error) {
            console.error('Erro ao excluir operação:', error);
            alert('Erro ao excluir operação');
        }
    }
});

let step = 1;
const totalSteps = 8;

function updateSteps() {
    for (let i = 1; i <= totalSteps; i++) {
        document.getElementById(`step-${i}`).classList.toggle("d-none", i !== step);
    }
    document.getElementById("progress-bar").style.width = (step * 12.5) + "%";  // Ajusta a barra de progresso
    document.getElementById("prev-btn").disabled = step === 1;
    document.getElementById("next-btn").textContent = step === totalSteps ? "Finish" : "Proximo";

    // Muda a cor do botão "Previous" para vermelho quando avançar
    const prevBtn = document.getElementById("prev-btn");
    if (step > 1) {
        prevBtn.classList.remove("btn-secondary");  // Remove o estilo padrão
        prevBtn.classList.add("btn-danger");        // Adiciona o estilo vermelho
    } else {
        prevBtn.classList.remove("btn-danger");    // Remove o vermelho se estiver no primeiro passo
        prevBtn.classList.add("btn-secondary");    // Retorna para o estilo padrão
    }
}

document.getElementById("next-btn").addEventListener("click", function() {
    if (step < totalSteps) {
        step++;
        updateSteps();
    } else {
        // Ao clicar em "Finish", enviar os dados para o servidor
        document.getElementById('form-operacao').dispatchEvent(new Event('submit'));
    }
});

document.querySelectorAll('#form-operacao input:not([type="file"]), #form-operacao select').forEach(input => {
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Impede o comportamento padrão do Enter
            
            // Valida o campo atual antes de avançar
            if (this.checkValidity()) {
                document.getElementById('next-btn').click();
            } else {
                this.reportValidity(); // Mostra mensagem de validação
            }
        }
    });
});

document.getElementById("prev-btn").addEventListener("click", function() {
    if (step > 1) {
        step--;
        updateSteps();
    }
});

// Evento de envio do formulário
document.getElementById('form-operacao').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Validação dos campos obrigatórios
    const data = document.getElementById('data').value;
    const ativo = document.getElementById('ativo').value;
    const evento = document.getElementById('evento').value;
    const localizacao = document.getElementById('localizacao').value;
    const resultado = document.getElementById('resultado').value;
    const foto = document.getElementById('foto').files.length > 0;

    // Coletando os valores dos checkboxes "erros"
    const erros = [];
    if (document.getElementById('erro1').checked) erros.push(document.getElementById('erro1').value);
    if (document.getElementById('erro2').checked) erros.push(document.getElementById('erro2').value);
    if (document.getElementById('erro3').checked) erros.push(document.getElementById('erro3').value);

    // Verifica se algum campo obrigatório está vazio
    if (!data || !ativo || !evento || !localizacao || !resultado || erros.length === 0 || !foto) {
        // Exibe o toast de erro
        const toast = new bootstrap.Toast(document.getElementById('toastErro'));
        toast.show();
        return;  // Não envia o formulário
    }

    const formData = new FormData();
    formData.append('data', data);
    formData.append('ativo', ativo);
    formData.append('evento', evento);
    formData.append('localizacao', localizacao);
    formData.append('resultado', resultado);
    formData.append('erros', JSON.stringify(erros)); // Envia os erros selecionados

    formData.append('observacao', document.getElementById('observacao').value);
    formData.append('foto', document.getElementById('foto').files[0]);

    try {
        const response = await fetch('http://localhost:3000/trades', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            carregarOperacoes();  // Recarregar as operações após envio
            document.getElementById('form-operacao').reset();  // Limpar o formulário
            step = 1;  // Voltar para a primeira etapa
            updateSteps();  // Atualizar os passos
            bootstrap.Modal.getInstance(document.getElementById('modalTrade')).hide();  // Fechar o modal
        } else {
            alert("Erro ao enviar operação");
        }
    } catch (error) {
        console.error('Erro ao salvar operação:', error);
        alert('Erro ao enviar operação');
    }
});



updateSteps();  // Inicializa o estado do formulário, mostrando a primeira etapa.

carregarOperacoes();  // Carregar operações ao iniciar
