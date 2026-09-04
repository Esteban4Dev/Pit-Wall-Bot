// Banco de trivia "difícil": hechos históricos poco conocidos, verificados
// uno por uno (la fuente original tenía varios errores y contradicciones —
// fechas cruzadas, afirmaciones desactualizadas, terminología técnica
// inventada — así que esto está reescrito y corregido, no copiado).
//
// Convención: la opción correcta siempre va primero (options[0]); el código
// que consume este archivo baraja el orden en tiempo de ejecución, así que
// no hace falta desordenarlas a mano aquí.
const TRIVIA_QUESTIONS = [
  { id: 'q1', question: '¿Quién fue la primera mujer en sumar puntos en un Gran Premio de F1 (GP de España 1975)?', options: ['Lella Lombardi', 'Maria Teresa de Filippis', 'Divina Galica', 'Desiré Wilson'], correctIndex: 0 },
  { id: 'q2', question: '¿Qué piloto ganó el título de 1989 tras la controvertida colisión con Ayrton Senna en Suzuka?', options: ['Alain Prost', 'Nigel Mansell', 'Gerhard Berger', 'Nelson Piquet'], correctIndex: 0 },
  { id: 'q3', question: '¿Qué piloto es el único en ganar un título mundial con un auto construido por su propio equipo?', options: ['Jack Brabham', 'Bruce McLaren', 'Dan Gurney', 'John Surtees'], correctIndex: 0 },
  { id: 'q4', question: '¿Quién fue el primer piloto estadounidense en ganar el campeonato mundial de F1 (1961)?', options: ['Phil Hill', 'Dan Gurney', 'Mario Andretti', 'Richie Ginther'], correctIndex: 0 },
  { id: 'q5', question: '¿Qué piloto ganó el título de 1976 tras el grave accidente de Niki Lauda en el Nürburgring?', options: ['James Hunt', 'Jody Scheckter', 'Clay Regazzoni', 'Carlos Reutemann'], correctIndex: 0 },
  { id: 'q6', question: '¿Qué piloto fue el primero en ganar dos campeonatos mundiales consecutivos (1952 y 1953)?', options: ['Alberto Ascari', 'Juan Manuel Fangio', 'Giuseppe Farina', 'Mike Hawthorn'], correctIndex: 0 },
  { id: 'q7', question: '¿Qué piloto ganó la primera victoria de Williams en F1, en el GP de Gran Bretaña de 1979?', options: ['Clay Regazzoni', 'Alan Jones', 'Carlos Reutemann', 'Jacques Laffite'], correctIndex: 0 },
  { id: 'q8', question: '¿Qué piloto es el único en ganar el GP de Mónaco, las 500 Millas de Indianápolis y las 24 Horas de Le Mans (la "Triple Corona")?', options: ['Graham Hill', 'Mario Andretti', 'Jim Clark', 'Emerson Fittipaldi'], correctIndex: 0 },
  { id: 'q9', question: '¿Qué piloto ganó un Gran Premio en 1968 en un auto con su propio apellido en el chasis?', options: ['Bruce McLaren', 'Jack Brabham', 'Dan Gurney', 'John Surtees'], correctIndex: 0 },
  { id: 'q10', question: '¿Qué circuito fue sede del Gran Premio de Francia entre 1991 y 2008?', options: ['Magny-Cours', 'Paul Ricard', 'Dijon-Prenois', 'Rouen-Les-Essarts'], correctIndex: 0 },
  { id: 'q11', question: '¿Qué piloto salió del retiro en 1982 para volver a McLaren, y ganó el título mundial en 1984?', options: ['Niki Lauda', 'Alan Jones', 'Jody Scheckter', 'Carlos Reutemann'], correctIndex: 0 },
  { id: 'q12', question: '¿A qué piloto le arrebató Lewis Hamilton el título en la última curva del GP de Brasil 2008?', options: ['Felipe Massa', 'Kimi Räikkönen', 'Robert Kubica', 'Fernando Alonso'], correctIndex: 0 },
  { id: 'q13', question: '¿En qué circuito de Austin, Texas, con trazado antihorario, se corre el GP de Estados Unidos?', options: ['Circuit of the Americas', 'Indianapolis Motor Speedway', 'Watkins Glen', 'Long Beach'], correctIndex: 0 },
  { id: 'q14', question: '¿En qué localidad catalana está el Circuit de Barcelona-Catalunya?', options: ['Montmeló', 'Sitges', 'Tarragona', 'Girona'], correctIndex: 0 },
  { id: 'q15', question: '¿En qué región de Italia está el Mugello Circuit, que debutó en la F1 en 2020?', options: ['Toscana', 'Lombardía', 'Emilia-Romaña', 'Véneto'], correctIndex: 0 },
  { id: 'q16', question: '¿Qué circuito alemán fue la última sede del GP de Alemania, en 2019?', options: ['Hockenheimring', 'Nürburgring', 'AVUS', 'Norisring'], correctIndex: 0 },
  { id: 'q17', question: '¿En qué ciudad está el Yas Marina Circuit, sede del GP de Abu Dabi?', options: ['Abu Dabi', 'Dubái', 'Doha', 'Manama'], correctIndex: 0 },
  { id: 'q18', question: '¿Cerca de qué ciudad europea está el Hungaroring, sede del GP de Hungría?', options: ['Budapest', 'Viena', 'Praga', 'Bratislava'], correctIndex: 0 },
  { id: 'q19', question: '¿Qué circuito japonés es célebre por su trazado en forma de "ocho", cruzándose a sí mismo?', options: ['Suzuka', 'Fuji Speedway', 'Twin Ring Motegi', 'Okayama'], correctIndex: 0 },
  { id: 'q20', question: '¿En qué país europeo está el Red Bull Ring, sede del GP de Austria?', options: ['Austria', 'Eslovenia', 'Suiza', 'Alemania'], correctIndex: 0 },
  { id: 'q21', question: '¿Qué circuito ruso fue sede del GP de Rusia hasta 2021, antes de salir del calendario?', options: ['Sochi Autodrom', 'Moscow Raceway', 'Igora Drive', 'Nizhny Novgorod'], correctIndex: 0 },
  { id: 'q22', question: '¿Qué circuito francés reemplazó a Magny-Cours como sede del GP de Francia (desde 2018)?', options: ['Paul Ricard', 'Dijon-Prenois', 'Rouen-Les-Essarts', 'Reims-Gueux'], correctIndex: 0 },
  { id: 'q23', question: '¿En qué ciudad canadiense está el Circuit Gilles Villeneuve?', options: ['Montreal', 'Toronto', 'Vancouver', 'Ottawa'], correctIndex: 0 },
  { id: 'q24', question: '¿En qué país está el Autódromo Hermanos Rodríguez, célebre por su gran altitud sobre el nivel del mar?', options: ['México', 'Perú', 'Colombia', 'Bolivia'], correctIndex: 0 },
  { id: 'q25', question: '¿Qué escudería ganó el primer título de pilotos de la historia en 1950 (antes de que existiera el título de constructores)?', options: ['Alfa Romeo', 'Ferrari', 'Maserati', 'Talbot-Lago'], correctIndex: 0 },
  { id: 'q26', question: '¿En qué ciudad inglesa tiene su fábrica el equipo Mercedes F1?', options: ['Brackley', 'Woking', 'Milton Keynes', 'Grove'], correctIndex: 0 },
  { id: 'q27', question: '¿En qué ciudad inglesa tiene su fábrica el equipo Red Bull Racing?', options: ['Milton Keynes', 'Brackley', 'Woking', 'Silverstone'], correctIndex: 0 },
  { id: 'q28', question: '¿Cuántos títulos de constructores consecutivos ganó Red Bull entre 2010 y 2013?', options: ['4', '2', '3', '5'], correctIndex: 0 },
  { id: 'q29', question: '¿En qué ciudad inglesa tiene su fábrica el equipo McLaren?', options: ['Woking', 'Brackley', 'Milton Keynes', 'Grove'], correctIndex: 0 },
  { id: 'q30', question: '¿En qué ciudad inglesa tiene su fábrica el equipo Williams?', options: ['Grove', 'Woking', 'Brackley', 'Enstone'], correctIndex: 0 },
  { id: 'q31', question: '¿En qué localidad francesa tenía su base el equipo Renault F1 (hoy Alpine)?', options: ['Enstone', 'Viry-Châtillon', 'Magny-Cours', 'Toulouse'], correctIndex: 0 },
  { id: 'q32', question: '¿En qué ciudad suiza tiene su base el equipo Sauber?', options: ['Hinwil', 'Zúrich', 'Ginebra', 'Basilea'], correctIndex: 0 },
  { id: 'q33', question: '¿Qué escudería con sede en Brackley ganó el título de constructores en 2009, su única temporada de existencia, antes de convertirse en Mercedes?', options: ['Brawn GP', 'Honda Racing', 'Force India', 'Toyota'], correctIndex: 0 },
  { id: 'q34', question: '¿Qué piloto ganó su primer Gran Premio a los 18 años, en su debut con Red Bull en el GP de España 2016?', options: ['Max Verstappen', 'Charles Leclerc', 'Lando Norris', 'George Russell'], correctIndex: 0 },
  { id: 'q35', question: '¿Qué piloto italiano ganó el GP de Francia de 1961 en su primera carrera de F1?', options: ['Giancarlo Baghetti', 'Lorenzo Bandini', 'Ludovico Scarfiotti', 'Elio de Angelis'], correctIndex: 0 },
  { id: 'q36', question: '¿En qué circuito falleció Ayrton Senna en 1994?', options: ['Imola', 'Mónaco', 'Spa-Francorchamps', 'Interlagos'], correctIndex: 0 },
  { id: 'q37', question: '¿Qué apodo recibió Alain Prost por su estilo analítico de conducir?', options: ['"El Profesor"', '"El Regenmeister"', '"El Matador"', '"El Tiburón"'], correctIndex: 0 },
  { id: 'q38', question: '¿Qué escudería británica ganó su primer título de constructores en 1963 con Jim Clark como piloto?', options: ['Lotus', 'BRM', 'Cooper', 'Vanwall'], correctIndex: 0 },
  { id: 'q39', question: '¿Qué piloto austríaco volvió a correr solo 6 semanas después de su grave accidente en el Nürburgring de 1976?', options: ['Niki Lauda', 'Jochen Rindt', 'Helmut Marko', 'Gerhard Berger'], correctIndex: 0 },
  { id: 'q40', question: '¿A qué ciudad se mudó el Gran Premio de Australia en 1996, tras años en Adelaida?', options: ['Melbourne', 'Sídney', 'Perth', 'Brisbane'], correctIndex: 0 },
  { id: 'q41', question: '¿Qué piloto brasileño ganó tres títulos mundiales (1988, 1990 y 1991) antes de morir en 1994?', options: ['Ayrton Senna', 'Nelson Piquet', 'Emerson Fittipaldi', 'Rubens Barrichello'], correctIndex: 0 },
  { id: 'q42', question: '¿Cuántos títulos mundiales de pilotos ganó Michael Schumacher?', options: ['7', '5', '6', '8'], correctIndex: 0 },
  { id: 'q43', question: '¿En qué año debutó la Fórmula 1 como campeonato mundial?', options: ['1950', '1946', '1955', '1960'], correctIndex: 0 },
  { id: 'q44', question: '¿Qué escudería tiene más títulos de constructores en la historia de la F1?', options: ['Ferrari', 'McLaren', 'Williams', 'Mercedes'], correctIndex: 0 },
  { id: 'q45', question: '¿Cuántas vueltas tiene el Gran Premio de Mónaco?', options: ['78', '58', '66', '90'], correctIndex: 0 },
  { id: 'q46', question: '¿Cuál es el circuito más largo del calendario actual de F1?', options: ['Spa-Francorchamps', 'Monza', 'Silverstone', 'Suzuka'], correctIndex: 0 },
  { id: 'q47', question: '¿Quién tenía el récord de más victorias en F1 antes de que Lewis Hamilton lo superara?', options: ['Michael Schumacher', 'Alain Prost', 'Ayrton Senna', 'Sebastian Vettel'], correctIndex: 0 },
  { id: 'q48', question: '¿En qué década se hizo obligatorio el cinturón de seguridad en F1?', options: ['1970s', '1950s', '1960s', '1980s'], correctIndex: 0 },
  { id: 'q49', question: '¿Qué escudería introdujo el "efecto suelo" (ground effect) en los años 70?', options: ['Lotus', 'McLaren', 'Brabham', 'Tyrrell'], correctIndex: 0 },
  { id: 'q50', question: '¿Cuál fue el último año en que se compitió con motores V10 en F1, antes de pasar a V8?', options: ['2005', '2003', '2008', '2010'], correctIndex: 0 }
];

module.exports = { TRIVIA_QUESTIONS };
