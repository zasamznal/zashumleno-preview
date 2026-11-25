// Price adjustment by body type and car brand. The owner edits these numbers in the cabinet
// («Цены по автомобилю»). Prices in the price list are the base: a sedan of a mass-market brand.
window.STUDIO_VEHICLES = {
  basis: 'Базовые цены прайса — для седана массовой марки. Для других машин калькулятор добавляет наценку за размер и сложность разборки.',
  rounding: 500,
  bodies: [
    { id: 'sedan', title: 'Седан', shape: 'sedan', percent: 0, zones: {} },
    { id: 'hatchback', title: 'Хэтчбек', shape: 'hatchback', percent: 0, zones: { trunk: 5 } },
    { id: 'liftback', title: 'Лифтбек', shape: 'liftback', percent: 5, zones: { trunk: 10 } },
    { id: 'wagon', title: 'Универсал', shape: 'wagon', percent: 10, zones: { trunk: 20, roof: 15 } },
    { id: 'crossover', title: 'Кроссовер', shape: 'crossover', percent: 15, zones: { trunk: 25, arches: 20 } },
    { id: 'suv', title: 'Внедорожник', shape: 'suv', percent: 30, zones: { trunk: 40, arches: 35, roof: 35 } }
  ],
  classes: [
    {
      id: 'mass', title: 'Массовые марки', percent: 0,
      brands: ['Lada', 'Kia', 'Hyundai', 'Solaris', 'Renault', 'Skoda', 'Volkswagen', 'Nissan', 'Mitsubishi', 'Suzuki',
        'Chevrolet', 'Ford', 'Opel', 'Peugeot', 'Citroën', 'Chery', 'Geely', 'Haval', 'Changan', 'Omoda', 'Jaecoo',
        'Belgee', 'Tenet', 'Москвич', 'Jetour', 'GAC', 'FAW', 'Great Wall', 'Livan', 'Kaiyi', 'Dongfeng', 'JAC',
        'BAIC', 'Datsun', 'Daewoo', 'Ravon', 'УАЗ']
    },
    {
      id: 'business', title: 'Бизнес-класс', percent: 15,
      brands: ['Toyota', 'Mazda', 'Honda', 'Subaru', 'Exeed', 'Tank', 'BYD', 'Lynk & Co', 'Jeep', 'Mini', 'KGM',
        'SsangYong', 'Dodge', 'Chrysler', 'Denza']
    },
    {
      id: 'premium', title: 'Премиум', percent: 30,
      brands: ['BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Porsche', 'Land Rover', 'Jaguar', 'Volvo', 'Infiniti',
        'Genesis', 'Cadillac', 'Lincoln', 'Acura', 'Tesla', 'Hongqi', 'Li Auto', 'Zeekr', 'Voyah', 'Aito',
        'Avatr', 'Maserati', 'Bentley', 'Rolls-Royce']
    }
  ],
  popular: ['Geely', 'Haval', 'Chery', 'Kia', 'Hyundai', 'Toyota', 'Volkswagen', 'Skoda', 'BMW', 'Mercedes-Benz', 'Lada']
};
