// Переменные, нужные для работы функционала

// элементы формы расчета
const fromInput = document.getElementById('from');
const toInput = document.getElementById('to');
const calcButton = document.getElementById('calc');
const submitButton = document.getElementById('submit');

// элементы в расчетах
const distanceValue = document.getElementById('distanceValue');
const durationValue = document.getElementById('durationValue');
const rateValue = document.getElementById('rateValue');
const totalValue = document.getElementById('totalValue');

// элементы формы заявки
const orderForm = document.getElementById('orderForm');
const nameInput = document.getElementById('customerName');
const phoneInput = document.getElementById('customerPhone');
const commentInput = document.getElementById('comment');
const orderSuccessBlock = document.getElementById('orderSuccess');
const orderIdValue = document.getElementById('orderId');

// Элементы карточек размеров
const sizes = document.querySelectorAll('.main-size-card');

// Элементы карточек скоростей
const speeds = document.querySelectorAll('.main-speed-card');

// Переменные для карты, маршрута и расчетов
let map;
let mapRoute;
let calculation;

// Ставка за км
const RATES = { xs: 9, s: 13, m: 20, l: 27, xl: 35, max: 70 };
// Минимальные тарифы
const MIN_BY_SIZE = { xs: 149, s: 199, m: 249, l: 349, xl: 499, max: 999 };

// Запускаем карту
ymaps.ready(() => {
    map = new ymaps.Map('map', {
        center: [55.751244, 37.618423],
        zoom: 5,
        controls: ['zoomControl']
    });

    new ymaps.SuggestView('from');
    new ymaps.SuggestView('to');

    [sizes, speeds].forEach(group => {
        group.forEach(element => {
            element.addEventListener('click', () => {
                group.forEach((c) =>
                    c.classList.toggle('is-active', c.dataset.value === element.dataset.value)
                );
                renderInfo();
                checkCalcAvailability();
            });
        });
    });
});

// Активация кнопки расчета
[fromInput, toInput].forEach((input) => {
    input.addEventListener('input', () => {
        checkCalcAvailability();
    });
});

// Проверка возможности расчета
function checkCalcAvailability() {
    const hasInputs = fromInput.value && toInput.value;
    const sizeSelected = document.querySelector('.main-size-card.is-active');
    const speedSelected = document.querySelector('.main-speed-card.is-active');

    calcButton.disabled = !(hasInputs && sizeSelected && speedSelected);
}

// Основной расчет
calcButton.addEventListener('click', () => {
    if (!map) return;

    if (mapRoute) {
        map.geoObjects.remove(mapRoute);
        mapRoute = null;
    }

    mapRoute = new ymaps.multiRouter.MultiRoute(
        { referencePoints: [fromInput.value, toInput.value] },
        { boundsAutoApply: false }
    );

    map.geoObjects.add(mapRoute);

    mapRoute.model.events.add('requestsuccess', () => {
        try {
            const activeRoute = mapRoute.getActiveRoute();
            if (!activeRoute) return failedCalculation();

            const sizeEl = document.querySelector('.main-size-card.is-active');
            const speedEl = document.querySelector('.main-speed-card.is-active');

            if (!sizeEl || !speedEl) return failedCalculation();

            const size = sizeEl.dataset.value;
            const speed = speedEl.dataset.value;

            const km = activeRoute.properties.get('distance').value / 1000;

            let total = Math.max(MIN_BY_SIZE[size], Math.ceil(km * RATES[size]));
            let duration = Math.min(30, 1 + Math.ceil(km / 80));

            if (speed === 'fast') {
                total = Math.ceil(total * 1.15);
                duration = Math.max(1, Math.ceil(duration - (duration * 0.30)));
            }

            calculation = {
                from: fromInput.value,
                to: toInput.value,
                size,
                distance: km.toFixed(1),
                duration,
                rate: RATES[size],
                total,
                speed
            };

            renderInfo({
                distanceText: `${calculation.distance} км`,
                durationText: `${calculation.duration} дн.`,
                rateText: `${calculation.rate} ₽/км`,
                totalText: calculation.total
            });

            submitButton.disabled = false;

        } catch (err) {
            failedCalculation();
        }
    });

    mapRoute.model.events.add('requestfail', failedCalculation);
});

// Вывод значений
function renderInfo(info = null) {
    distanceValue.textContent = info ? info.distanceText : '—';
    durationValue.textContent = info ? info.durationText : '—';
    rateValue.textContent = info ? info.rateText : '—';
    totalValue.textContent = info ? info.totalText : '—';
}

// Ошибка
function failedCalculation() {
    calculation = null;
    renderInfo();
    alert('Не удалось построить маршрут. Проверьте адреса и выбранные параметры.');
    submitButton.disabled = true;
}

// Отправка заявки
submitButton.addEventListener('click', async () => {
    if (!calculation) {
        alert('Сначала рассчитайте стоимость, чтобы оформить заявку.');
        return;
    }

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const comment = commentInput.value.trim();

    if (!name) {
        alert('Введите имя');
        return;
    }
    if (!phone) {
        alert('Введите корректный телефон (минимум 10 цифр)');
        return;
    }

    const payload = {
        id: Math.floor(Math.random() * (100000 - 10000 + 1)) + 10000,
        customer: { name, phone, comment },
        createdAt: new Date().toISOString()
    };

    console.log('Заказ: ' + payload.id, payload);

    orderIdValue.textContent = payload.id;

    orderForm.style.display = 'none';
    orderSuccessBlock.classList.add('is-visible');
});