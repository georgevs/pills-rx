SET foreign_key_checks = 0;

TRUNCATE TABLE Drugs;
INSERT INTO Drugs (did, description) VALUES
  (1, 'Сефпотек 200мг'), 
  (2, 'Лимекс Форте'),
  (3, 'Микомакс 150мг');
  
TRUNCATE TABLE Prescriptions;
INSERT INTO Prescriptions (pid, numDays, start) VALUES 
  (1, 14, '2024-04-09');

TRUNCATE TABLE Takes;
INSERT INTO Takes (pid, did, time, dose, days) VALUES
  (1, 1, 800, 1, NULL),
  (1, 1, 2000, 1, NULL),
  (1, 2, 1200, 1, NULL),
  (1, 3, 1200, 1, '1,6,13');
