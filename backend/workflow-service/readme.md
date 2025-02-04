1. This is a api serv
1.  use the mongodb, express, react, node stack.
2. create a docker to run the application
3. the api host should be exposed to /workflow-service
4. the controller should have the versioning like /v1 before the path. 
5. create a sample workflow controller that does basic crud against the mongo db. [ note mongodb will be used in many aspects of the application , so make iyt generic and reusable]
6. enable swagger for the api. 
8. make the project stucture properly for enterprise grade application developemnet 
9. keep redis wrapper provistion which will be used in many aspects of the application. 
10. Create a docker file for the application, that run the application in the container. 
11. Use node version 22.


workflow requirements:
1. Workflow can be created from a template or from scratch. 
2. when created scratch it will get created and saved in the db and will be available for the user to use. [which is untitled] 
3. workflow will have the configuration which will be a graph
4. from the frontned workflow will get updated whever there is a change in the config. [ so optimise it for hight frequent update]
5. When they publish the published workflow will be available to the users as a version. so wevry time they the workflow will be created as a new version. 
6. On run the workflow it is going to invoke workflow execution service[whcih is a separate service, which will takes care of the execution]. 
