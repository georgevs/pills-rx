drop schema if exists pills_rx;
create schema pills_rx;
use pills_rx;

create table Drugs (
  id int primary key auto_increment, 
  drug_description varchar(255) not null
);

create table Prescriptions (
  id int primary key auto_increment, 
  num_days int not null,
  start_date date
);

create table Takes (
  prescription_id int not null,
  drug_id int not null,
  take_time int not null,
  dose int not null,
  take_days varchar(255),
  constraint PrescriptionId foreign key (prescription_id) references Prescriptions (id),
  constraint DrugId foreign key (drug_id) references Drugs (id)
);

create unique index TakesIndex on Takes (prescription_id, drug_id, take_time);
