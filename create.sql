CREATE DOMAIN SSN_TYPE AS CHAR(11)
CHECK ( 
  VALUE ~ '^\d{3}-\d{2}-\d{4}$'
);

-- Employee Table
CREATE TABLE Employee (
  ESSN SSN_TYPE NOT NULL DEFAULT '000-000-0000',
  Salary INT DEFAULT NULL,
  Name VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (ESSN)
);

-- Apartment Complex Table 
CREATE TABLE Apartment_Complex (
  Complex_Number INT NOT NULL DEFAULT 0,
  Street VARCHAR(155) DEFAULT NULL,
  City VARCHAR(100) DEFAULT NULL,
  Addr_State VARCHAR(50) DEFAULT NULL, 
  Manager SSN_TYPE NOT NULL DEFAULT '000-000-0000',
  PRIMARY KEY (Complex_Number),
  FOREIGN KEY (Manager)
    REFERENCES Employee(ESSN) 
    ON DELETE SET DEFAULT 
);

-- Apartment Table
CREATE TABLE Apartment (
  Complex_Number INT NOT NULL DEFAULT 0,
  Room_Number INT NOT NULL DEFAULT 0,
  Floor_Plan VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (Room_Number, Complex_Number),
  FOREIGN KEY (Complex_Number) 
    REFERENCES Apartment_Complex(Complex_Number) 
    ON DELETE SET DEFAULT 
);

-- Renters Table 
CREATE TABLE Renters (
  RSSN SSN_TYPE NOT NULL DEFAULT '000-000-0000',
  Credit_Score INT DEFAULT NULL,
  Name VARCHAR(255) DEFAULT NULL,
  Complex_Number INT NOT NULL DEFAULT 0,
  Room_Number INT NOT NULL DEFAULT 0,
  PRIMARY KEY (RSSN),
  FOREIGN KEY (Room_Number, Complex_Number) 
    REFERENCES Apartment(Room_Number, Complex_Number) 
    ON DELETE SET DEFAULT
);
-- lease type table
CREATE TABLE Lease_Type (
  Type INT DEFAULT NULL,
  Payment_Amount DECIMAL(10,2) DEFAULT 0, 
  PRIMARY KEY (Type)
);

-- Lease Table
CREATE TABLE Lease (
  Contract_ID INT NOT NULL DEFAULT 0,
  Type INT DEFAULT NULL,
  PRIMARY KEY (Contract_ID),
  FOREIGN KEY (Type)
    REFERENCES Lease_Type(Type)
    ON DELETE SET DEFAULT
);

-- Contractors Table 
CREATE TABLE Contractors (
  Company_Name VARCHAR(255) NOT NULL DEFAULT 'Not Provided',
  PRIMARY KEY (Company_Name)
);

-- Work Order Table
CREATE TABLE Work_Order (
  Project_ID INT NOT NULL DEFAULT 0,
  Type VARCHAR(255) DEFAULT NULL,
  Complex_Number INT NOT NULL DEFAULT 0,
  PRIMARY KEY (Project_ID, Complex_Number),
  FOREIGN KEY (Complex_Number) 
    REFERENCES Apartment_Complex(Complex_Number)
    ON DELETE CASCADE
);
-- Commissions Table
CREATE TABLE Commissions (
  Complex_Number INT NOT NULL DEFAULT 0,
  Company_Name VARCHAR(255) NOT NULL DEFAULT 'Not Provided',
  Project_ID INT NOT NULL DEFAULT 0,
  Num_Hrs INT DEFAULT 0,
  PRIMARY KEY (Complex_Number, Company_Name, Project_ID),
  FOREIGN KEY (Complex_Number) 
    REFERENCES Apartment_Complex(Complex_Number) 
    ON DELETE SET DEFAULT,
  FOREIGN KEY (Company_Name) 
    REFERENCES Contractors(Company_Name) 
    ON DELETE SET DEFAULT,
  FOREIGN KEY (Project_ID, Complex_Number)
    REFERENCES Work_Order(Project_ID, Complex_Number)
    ON DELETE RESTRICT
);

-- Development Projects Table 
CREATE TABLE Development_Projects (
  Project_ID INT NOT NULL DEFAULT 0,
  Budget DECIMAL(10,2) DEFAULT 0, 
  Complex_Number INT NOT NULL DEFAULT 0,
  FOREIGN KEY (Project_ID, Complex_Number)
    REFERENCES Work_Order(Project_ID, Complex_Number)
    ON DELETE RESTRICT
);

-- Employees working at Apartment Complex Table
CREATE TABLE Employee_At_Complex (
  ESSN SSN_TYPE NOT NULL DEFAULT '000-000-0000',
  Complex_Number INT NOT NULL DEFAULT 0,
  PRIMARY KEY (ESSN, Complex_Number),
  FOREIGN KEY (ESSN) 
    REFERENCES Employee(ESSN) 
    ON DELETE CASCADE,
  FOREIGN KEY (Complex_Number) 
    REFERENCES Apartment_Complex(Complex_Number) 
    ON DELETE SET DEFAULT
);

-- Renters signing Lease Table 
CREATE TABLE Renter_Sign_Lease (
  RSSN SSN_TYPE NOT NULL DEFAULT '000-000-0000',
  Contract_ID INT NOT NULL DEFAULT 0,
  PRIMARY KEY (RSSN, Contract_ID),
  FOREIGN KEY (RSSN)
    REFERENCES Renters(RSSN)
    ON DELETE RESTRICT,
  FOREIGN KEY (Contract_ID)
    REFERENCES Lease(Contract_ID)
    ON DELETE RESTRICT
);

-- Employees fixing Residential Issues Table 
CREATE TABLE Employee_Fix_Issue (
  ESSN SSN_TYPE NOT NULL DEFAULT '000-000-0000',
  Project_ID INT NOT NULL DEFAULT 0,
  Complex_Number INT NOT NULL DEFAULT 0,
  PRIMARY KEY (ESSN, Project_ID, Complex_Number),
  FOREIGN KEY (ESSN) 
    REFERENCES Employee(ESSN) 
    ON DELETE SET DEFAULT,
  FOREIGN KEY (Project_ID, Complex_Number)
    REFERENCES Work_Order(Project_ID, Complex_Number)
    ON DELETE RESTRICT
);

-- Renters Reporting Residential Issues Table 
CREATE TABLE Renter_Report_Issue (
  RSSN SSN_TYPE NOT NULL DEFAULT '000-000-0000',
  Project_ID INT NOT NULL DEFAULT 0,
  Complex_Number INT NOT NULL DEFAULT 0,
  PRIMARY KEY (RSSN, Project_ID, Complex_Number),
  FOREIGN KEY (RSSN)
    REFERENCES Renters(RSSN)
    ON DELETE RESTRICT,
  FOREIGN KEY (Project_ID, Complex_Number)
    REFERENCES Work_Order(Project_ID, Complex_Number)
    ON DELETE RESTRICT
);

-- Residential Property Issues Table 
CREATE TABLE Property_Issues (
  Project_ID INT NOT NULL DEFAULT 0, 
  Description VARCHAR(255) DEFAULT 'Needs Description',
  Complex_Number INT NOT NULL DEFAULT 0,
  FOREIGN KEY (Project_ID, Complex_Number)
    REFERENCES Work_Order(Project_ID, Complex_Number)
    ON DELETE RESTRICT
);
