const input = document.getElementById("filter-input");
const dropdown = document.querySelector(".select-dropdown");
const optionsList = document.getElementById("optionsList");
const searchButton = document.getElementById("searchButton");
const dashBoard = document.getElementById("dashBoard");
const loadingModal = document.getElementById("loadingModal");
let selectedCripto = null;

const optionsCripto = [
  { label: "Bitcoin", value: "BTC" },
  { label: "Ethereum", value: "ETH" },
  { label: "Litecoin", value: "LTC" },
  { label: "Ripple", value: "XRP" },
  { label: "Cardano", value: "ADA" },
];

function filterOptions() {
  const filter = input.value.toLowerCase();
  const options = optionsList.getElementsByTagName("li");

  let hasVisibleOption = false;

  Array.from(options).forEach((option) => {
    const optionText = option.textContent || option.innerText;
    if (optionText.toLowerCase().includes(filter)) {
      option.style.display = "";
      hasVisibleOption = true;
    } else {
      option.style.display = "none";
    }
  });

  toggleDropdown(hasVisibleOption);
}

function selectOption(optionText, optionValue) {
  input.value = optionText;
  selectedCripto = optionValue;
  toggleDropdown(false);
}

function toggleDropdown(show) {
  dropdown.style.display = show ? "block" : "none";
}

// Eventos
// Adiciona o evento global de clique para fechar o dropdown ao clicar fora
document.addEventListener("click", function (event) {
  if (!input.contains(event.target) && !dropdown.contains(event.target)) {
    toggleDropdown(false); // Fecha o dropdown
  }
});

// Adiciona evento para filtrar opções
input.addEventListener("input", filterOptions);
// Exibe o dropdown ao focar no input
input.addEventListener("focus", () => toggleDropdown(true));

// Adiciona evento de clique para cada opção da lista
optionsList.addEventListener("click", (event) => {
  if (event.target.tagName === "LI") {
    const optionText = event.target.textContent || event.target.innerText;
    const optionValue = event.target.dataset.value;
    selectOption(optionText, optionValue);
  }
});

searchButton.addEventListener("click", async () => {
  showLoading();
  if (selectedCripto) {
    const criptoInfo = await getCotacao(selectedCripto);
    updateCards(criptoInfo);
  } else {
    alert("Selecione uma criptomoeda antes de buscar a cotação.");
  }
  hideLoading();
});

async function loadOptions() {
  try {
    const optionsHTML = optionsCripto
      .map((option) => `<li data-value="${option.value}">${option.label}</li>`)
      .join("");
    optionsList.innerHTML = optionsHTML;
  } catch (error) {
    console.error("Erro ao carregar opções:", error);
  }
}

loadOptions();

async function fetchData(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro ao buscar dados: ${response.status}`);
  }
  return await response.json();
}

async function getCotacao(cripto) {
  try {
    const [criptoInfoData, criptoCotacaoData] = await Promise.all([
      fetchData(
        `https://api.mercadobitcoin.net/api/v4/symbols?symbols=${cripto}-BRL`
      ),
      fetchData(
        `https://api.mercadobitcoin.net/api/v4/tickers?symbols=${cripto}-BRL`
      ),
    ]);

    // Extração e formatação dos dados
    const { "base-currency": symbol, description, type } = criptoInfoData;
    const { open, last, vol } = criptoCotacaoData[0];
    const variation =
      ((parseFloat(last) - parseFloat(open)) / parseFloat(open)) * 100;  

    const criptoInfo = {
      symbol: symbol[0],
      description: description[0],
      type: type[0],
      lastValue: last,
      variation: variation,
      volume: vol,
    };

    // const criptoInfo = {
    //   symbol: "BTC",
    //   description: "Bitcoin",
    //   type: "CRYPTO",
    //   lastValue: "536779.72707604",
    //   variation: -2.1430306040580454,
    //   volume: "140.89014157",
    // };

    // Exibe o resultado no console
    console.log("Informações da Criptomoeda:", criptoInfo);

    return criptoInfo;
  } catch (error) {
    console.error("Erro ao buscar dados da criptomoeda:", error);
    return null;
  }
}

const updateCards = (criptoInfo) => {
  const cardData = [
    {
      label: "Ativo Selecionado",
      value: criptoInfo.description,
      maskClass: "mask-one",
    },
    { label: "Ticker", value: criptoInfo.symbol, maskClass: "mask-two" },
    {
      label: "Última cotação em (R$)",
      value: formatNumber(criptoInfo.lastValue),
      maskClass: "mask-three",
    },
    { label: "Segmento", value: criptoInfo.type, maskClass: "mask-three" },
    {
      label: "Variação em 24H",
      value: formatPercent(criptoInfo.variation),
      maskClass: "mask-four",
    },
    {
      label: "Volume Movimentado",
      value: formatNumber(criptoInfo.volume),
      maskClass: "mask-one",
    },
  ];

  const dashBoardCards = cardData
    .map((data) => createCard(data.label, data.value, data.maskClass))
    .join("");

  dashBoard.innerHTML = dashBoardCards;
};

const formatNumber = (number) => {
  number = Number(number);

  if (number >= 1e9) {
    return (number / 1e9).toFixed(0) + "B"; // Bilhões
  } else if (number >= 1e6) {
    return (number / 1e6).toFixed(0) + "M"; // Milhões
  } else if (number >= 1e3) {
    return (number / 1e3).toFixed(0) + "K"; // Milhar
  }

  return formatNumberPTBR(number);
};

const formatPercent = (number) => {
  return `${formatNumberPTBR(number)}%`;
};

const formatNumberPTBR = (number) => {
  const formatter = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(number);
};

const createCard = (label, value, maskClass) => {
  return `
    <div class="card">
        <div class="css-text-mask ${maskClass}">${value}</div>
        <p>${label}</p>
    </div>
  `;
};

const showLoading = () => {
  loadingModal.style.display = "flex";
};
const hideLoading = () => {
  loadingModal.style.display = "none";
};
