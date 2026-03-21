#Product Outline#
##Part 1 - Operating/ecosystem of multiple tools/apps##
- The home screen will be an overview of all my apps in a grid view.
- From there I have the ability to launch any app I want and the general user management and security can be on that global level to simplify.


##Part 2 - Individual Apps and tools##
- Each app is self contained and don't interact with another app.
- We are only talking about smaller utilities to assist my in my personal life

###App Ideas###
To get the idea what apps we talk about and what we have in mind already. Goal is to find a way to get started, but we will get more conrete on the apps.

1. 
- App to track the first words of a toddler
- Should provide a way to add now words
- Should provide some duplication check capabilities (exact match, fuzzy match, ...)
- Should provide a way to read the data efficiently

2.
- Tool to track poker results.
- Should provide historical graphical view 
- Should provide a way to enter new results
- Note: Exist already as prototype and can be shared.

3.
- Tool to support a poker sessions
- Should allow tracking players and their buy-ins
- Should provide win/loss overview and calculations
- Should provide functionality to close the session and create a plan with minimal transactions to solve the player balances 
- Note: Exist already as prototype and can be shared.


##General throughts and guidance##
- Ideally we have an app like experience (e.g. PWA) making it easy to run this from my mobile device.
- To keep it simple, the individual app, as well as the app ecosystem can be the same technology and sort of share the same stack. It is just important that inside the source code structure (repo) they are a bit separated making easier to work on them individually.
- As it will be key for most of the apps to store data and remember state, we certainly need a simple database to store the data.
- For the access from anywhere we require some web hosting 

##Costs##
- As this is for personal use, we need to avoid any operating costs and check for open source solutions or services that offer free tiers.
- One exception could be cloud hosting, but as traffic is minimal it has to be a ver low price if free of charge cannot be achieved.

##Security##
- The application will be for personal use, but as I would like to use them from everywhere, we need some web hosting
- Security is key and we must protect all information, even if they don't appear to be very sensitive.
- Unless I tell you differently, you treat all information as sensitive