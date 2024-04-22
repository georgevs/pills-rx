set foreign_key_checks = 0;

truncate table Drugs;
insert into Drugs (did, description) values
  (1, 'Сефпотек 200мг'), 
  (2, 'Лимекс Форте'),
  (3, 'Микомакс 150мг');
  
truncate table Prescriptions;
insert into Prescriptions (pid, numDays, start) values 
  (1, 14, '2024-04-09');

truncate table Takes;
insert into Takes (pid, did, time, dose, days) values
  (1, 1, 800, 1, null),
  (1, 1, 2000, 1, null),
  (1, 2, 1200, 1, null),
  (1, 3, 1200, 1, '1,6,13');
