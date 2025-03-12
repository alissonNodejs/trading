    script.js
// Carregar operações ao iniciar
async function carregarOperacoes() {
  try {
    const response = await fetch('http://localhost:3000/trades');
    const operacoes = await response.json();
    preencherTabela(operacoes);
  } catch (error) {
    console.error('Erro ao carregar operações:', error);
  }
}

// Manipulação do formulário
document.getElementById('form-operacao').addEventListener('submit', async function(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append('data', document.getElementById('data').value);
  formData.append('ativo', document.getElementById('ativo').value);
  formData.append('evento', document.getElementById('evento').value);
  formData.append('localizacao', document.getElementById('localizacao').value);
  formData.append('resultado', document.getElementById('resultado').value);
  formData.append('erros', JSON.stringify(Array.from(document.getElementById('erros').selectedOptions).map(opt => opt.value)));
  formData.append('observacao', document.getElementById('observacao').value);
  formData.append('foto', document.getElementById('foto').files[0]);

  try {
    const response = await fetch('http://localhost:3000/trades', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      carregarOperacoes();
      document.getElementById('form-operacao').reset();
      bootstrap.Modal.getInstance(document.getElementById('modalTrade')).hide();
    }
  } catch (error) {
    console.error('Erro ao salvar operação:', error);
  }
});