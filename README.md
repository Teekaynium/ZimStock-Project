# ZimStock-Project

<h2>Description</h2>
This project aims to extract Zimbabwe stock prices and traded volumes on a daily basis from the official website. This is done in order to create a continuous database as historical stock data is otherwise obtained at a hefty cost. This project enables free and easy access to historical Zim stock data.
<br />


<h2>Languages and Utilities Used</h2>

<b>Python 3.12.7, Java

</b>
  <h2>Python Packages Used</h2>
  <b>datetime, math, matplotlib, requests
</b>

<h2>Environments Used </h2>

- <b>Jupyter Notebook</b>

<h2>Program walk-through:</h2>


The code for the below section is found in this python file (https://github.com/Teekaynium/ZimStock-Project/blob/295ebbe165de6ec1ee9c4c151bad16cb87661642/Zimstockdata.tk.nbconvert.ipynb)
<p align="center">
Getting data from Zimbabwe Stock Exchange Website: <br/>
<img src="https://i.imgur.com/uaAI4k3.png" height="80%" width="80%" alt = "Data Collection"/>
<br />
<br />
Creating Dataframes for Specific Parameters from Extracted Data:  <br/>
Open Price Dataframe Function
<img src="https://i.imgur.com/Fw4iBe0.png" height="80%" width="80%" alt="Trend Removal"/>

<p align="center">
Close Price Dataframe Function
<img src="https://i.imgur.com/6vHbAYX.png" height="80%" width="80%" alt="Trend Removal"/>

<p align="center">
Volume Traded Dataframe Function
<img src="https://i.imgur.com/MePz3iP.png" height="80%" width="80%" alt="Trend Removal"/>
<br />
<br />
Step 1 Existing json File with Historical Data:  <br/>
<img src="https://i.imgur.com/YB00xcX.png" height="80%" width="80%" alt="Trend Removal"/>
<br />
<br />
Update Historical Data File with Extracted Daily Data:  <br/>
<img src="https://i.imgur.com/9ta14Fu.png" height="80%" width="80%" alt="Trend Removal"/>
<br />
<br />
Save Updated Data File:  <br/>
<img src="https://i.imgur.com/gMxbkJS.png" height="80%" width="80%" alt="Modelling"/>
<br />
<br />
The above code is run daily and the data is stored in the archive-single-file folder as a json file via this cron job (https://github.com/Teekaynium/ZimStock-Project/blob/62cfd0f296057a9905e54b3612265f087850d7e5/.github/workflows/run-notebook.yml). 
</p>
