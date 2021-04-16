# Welcome to Blackforest

## About this project
Read about the project [here](https://docs.google.com/document/d/1ST9445dMVRlob46SPF4afvi_F-6843a994p0uUiukao/edit?ts=6018b8e3)
## Requirements
### Softwares
* Python 3.8 + 	==> Installation [Guide](https://www.python.org/downloads/)
* MySQL DB 		==> Installation [Guide](https://dev.mysql.com/doc/mysql-installation-excerpt/5.7/en/)
* IDE           ==> [Options](https://www.programiz.com/python-programming/ide)

### Package Dependency
	bidict==0.21.2
	cachelib==0.1.1
	cffi==1.14.5
	click==7.1.2
	dnspython==1.16.0
	eventlet==0.30.2
	Flask==1.1.2
	Flask-Session==0.3.2
	Flask-SocketIO==4.3.2
	Flask-SQLAlchemy==2.5.1
	gevent==21.1.2
	gevent-websocket==0.10.1
	greenlet==1.0.0
	itsdangerous==1.1.0
	Jinja2==2.11.3
	MarkupSafe==1.1.1
	mysqlclient==2.0.3
	numpy==1.20.2
	pycparser==2.20
	python-dotenv==0.17.0
	python-engineio==3.14.2
	python-socketio==4.6.1
	pytz==2021.1
	six==1.15.0
	SQLAlchemy==1.3.20
	urllib3==1.26.4
	Werkzeug==1.0.1
	zope.event==4.5.0
	zope.interface==5.3.0	

## First Time Setup
### 1. Clone this server repository to your root folder:
>git clone \<link  of  this  repository>

If you dont have Git [read this github page](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository) for more information

### 2. Create a Virtual Environment in Python inside the repository folder & Install Dependencies

I am using repository name as Blackforest for all commands going forward
> cd Blackforest
	
create a new folder named 'venv' for your virtual environment [you can keep any name you want]
open command prompt inside the Blackforest repository
> python -m venv venv
cd venv/Scripts
activate
cd../..


To learn more about environment setup read [here](https://docs.python-guide.org/dev/virtualenvs/)

Now we have to install the packages from requirements.txt
>	pip install -r src/requirements.txt
### 3. Setup MySQL DB
open mysql command line client
and run the db_backup file to create the database with all the tables and entries
>source <path>/<to>/<the>/<file.sql/file.bak>

Read How [To restore/import a MySQL database](https://john-dugan.com/dump-and-restore-mysql-databases-in-windows/)

change the value of user name and pswd in the config file line

>'''NANDOR_DBCONN = os.getenv('NANDOR_DBCONN', 'mysql://root:pass@123@localhost/EXP')'''

a. root --> user
b. pass@123 -> password
c. @localhost is where its hosted
d. /EXP is the database which we are using
change the config.py according to your server setting and port forwarding policy. Here, since we use this application on a local server, we used localhost


### 4. Run the server
go to Blackforest/src
> cd Blackforest/src
python main.py

OR
> python Blackforest/src/main.py

### 5. Important links
	Create Mission Page = http://127.0.0.1:5000/
	Player Login - http://127.0.0.1:5000/login
	Admin Login - http://127.0.0.1:5000/admin-login

### 6. Instructions to running the application as a background service

For Ubuntu follow [this](https://github.com/mehrdadzakershahrak/Collaboration-Facilitation-Agent-CFAS/blob/main/start-bf.sh)

For windows follow [this](https://stackoverflow.com/questions/32808730/running-python-script-as-a-windows-background-process)

