# ZimStock-Project

## Current status

The automated daily data pipeline has been sunset.

Recent scrape results show the primary ZSE and VFEX price-sheet endpoints now return `HTTP 404: Not Found`:

- `https://www.zse.co.zw/price-sheet`
- `https://www.vfex.exchange/price-sheet`

The exchanges now charge for access to this market data. Because this was a non-profit research project intended to preserve free access to historical Zimbabwe market data, the project is being preserved as an archive rather than continuing as an active collection pipeline.

Because the main market-data endpoints are no longer publicly returning the expected tables, scheduled archive updates have been paused. The existing JSON files in `archive/` and `archive-single-file/` remain available as historical snapshots, but they should be treated as archived research data rather than a live daily feed.

The GitHub Actions workflow is retained as a manual no-op record of the sunset decision and no longer runs on a schedule or writes new results.

Earlier ZSE records are available in [bevennyamande/Zimbabwe-Stock-Exchange-Daily-Pricesheets](https://github.com/bevennyamande/Zimbabwe-Stock-Exchange-Daily-Pricesheets). See `DATA_SOURCES.md` for the import window and handoff tasks.

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
This code previously ran daily and stored data in the `archive-single-file/` folder as JSON via the GitHub Actions workflow. That workflow has now been sunset because the primary ZSE and VFEX source endpoints are no longer publicly returning the expected price-sheet data, and the exchanges now charge for access to that data.
</p>
