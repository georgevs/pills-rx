drop schema if exists pills_rx;
create schema pills_rx;
use pills_rx;

create table Drugs (
  did int primary key auto_increment, 
  description varchar(255) not null
);

create table Prescriptions (
  pid int primary key auto_increment, 
  numDays int not null,
  start date
);

create table Takes (
  pid int not null,
  did int not null,
  time int not null,
  dose int not null,
  days varchar(255),
  constraint PrescriptionId foreign key (pid) references Prescriptions (pid),
  constraint DrugId foreign key (did) references Drugs (did)
);

create unique index TakesIndex on Takes (pid, did, time);
