DROP SCHEMA IF EXISTS pills_rx;
CREATE SCHEMA pills_rx;
USE pills_rx;

CREATE TABLE Drugs (
  did INT PRIMARY KEY AUTO_INCREMENT, 
  description VARCHAR(255) NOT NULL
);

CREATE TABLE Prescriptions (
  pid INT PRIMARY KEY AUTO_INCREMENT, 
  numDays INT NOT NULL,
  start DATE
);

CREATE TABLE Takes (
  pid INT NOT NULL,
  did INT NOT NULL,
  time INT NOT NULL,
  dose INT NOT NULL,
  days VARCHAR(255),
  CONSTRAINT PrescriptionId FOREIGN KEY (pid) REFERENCES Prescriptions (pid),
  CONSTRAINT DrugId FOREIGN KEY (did) REFERENCES Drugs (did)
);

CREATE UNIQUE INDEX TakesIndex ON Takes (pid, did, time);
