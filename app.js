const puppeteer = require('puppeteer');
const log4js = require('log4js');
const fs = require('fs');
const config = require('./config')


log4js.configure('./log4js.json');
let log = log4js.getLogger("app");

log.info("Working...");

let args = [];
const chrome = { x: 1366, y: 1000 };

 

async function getInfo(){  
  let mainObj = []
    try {
        
        args.push(`--window-size=${width=chrome.x},${height=chrome.y}`);
        const browser = await puppeteer.launch({headless: false,args, slowMo: 100, });
        const page = await browser.newPage();
        
        await page.setViewport({width: 1366, height: 1000})
        await page.goto('https://www.dafabet.com/en/sports/');
        await page.waitFor(10000);
        //await page.waitFor(5000);
        // file://D:/d.html
          await page.click("#LoginForm_username");
        await page.type("#LoginForm_username", config.loginData.login)
        await page.click("#LoginForm_password");
        await page.type("#LoginForm_password", config.loginData.password)
        await page.click("#LoginForm_submit");
        await page.waitFor(15000);  

        const frame = await page.frames().find(frame => frame.name() === "sportsFrame")
        await frame.$eval('.icon-sportsMenu-live', el => el.click());
        await frame.$eval('div[title=All]', el => el.click({delay: 400}));
        await frame.$eval('div[title=Soccer]', el => el.click({delay: 400}));
        await page.waitFor(3000);
        await frame.$eval('.withSwitch', el => el.click({delay: 400}));
        await frame.$eval('.icon-decimalOdds', el => el.click({delay: 400})); 
        await page.waitFor(15000); 
        
        let elements = await frame.$$eval('.leagueGroup', function (data) {
          let resObj = [];
         
          data.forEach(function (el){
            try {
                let allTeams = el.querySelectorAll(".event");
                let allScores = el.querySelectorAll(".time");
                let allLeagues = Array.from(el.querySelectorAll(".leagueName"));
                let league = [];
                

                for(let team of allTeams) {
                  let obj;
                  if (team.children[0].innerText) {
                    obj = {};
                    allLeagues.forEach(el=>{
                      obj.sport = el.childNodes[1].textContent.replace(/\s\/\s/g, "");
                      obj.isLive = document.querySelector(".mainTitle").textContent
                      obj.league = el.childNodes[4].textContent;
                    });                   
                    
                    obj.home_team =  team.childNodes[0].children[0].children[0].innerText;
                    obj.away_team =  team.childNodes[1].children[0].children[0].innerText;
                    if(team.childNodes[0].children[0].children[0].children[1]){
                      obj.red_card_h = team.childNodes[0].children[0].children[0].children[1].innerText;
                    } else {
                      obj.red_card_h = 0;
                    }
                    if(team.childNodes[1].children[0].children[0].children[1]){
                      obj.red_card_a = team.childNodes[1].children[0].children[0].children[1].innerText;
                    } else {
                      obj.red_card_a = 0;
                    }
                    
                  }
                    obj ? league.push(obj) : '';
                }

                
                allScores.forEach((el, index) => {
                  const score = {                    
                    score_h: el.children[0].innerText[0],
                    score_a: el.children[0].innerText[2],
                    date: el.childNodes[1].childNodes[0].textContent.replace("'","")
                  };
                   
                  league[index] = Object.assign(league[index], score);
                });
          
               //////////////////////////////
               function calc(test, team, resolver){
                let a;
                let b; 
                let c;
                let d;
               try {
                 if(test === "" && team === "home") {
                  c = "",
                  d = ""
                 } else {
                  if(test.match(/\d.\d-/)){                    
                    a = test.match(/\d.\d-/)[0].replace("-", "");
                  } else {                    
                    if(test.length <=4){                      
                      a = test
                    } else {
                      if (test === ''){
                        a = ""
                      } else {                        
                        a = test.match(/\d/)[0].replace("-", "");
                      }                     
                    }                    
                  }
                  if(test.match(/-\d.\d/)){                    
                    b = test.match(/-\d.\d/)[0].replace("-", "");
                  } else {                    
                    if(test.length <=4){                      
                      b = 0
                    } else {                      
                      b = test.match(/-\d/)[0].replace("-", "");
                    }                    
                  }
                  if(resolver === true){
                    if(a === '0' && b === 0 ){                    
                    c = test
                    d = test
                  } else if (a && b === 0 && team === 'home') {                   
                        c = test
                        d = test
                      } else if(a && b === 0 && team === 'away') {                        
                        c = test
                        d = test
                      } else if(a && b && team === "home"){                        
                        c = -(+a - +b) / 2;
                        d = -(+a - +b) / 2
                        } else {                          
                          c = (+a - +b) / 2;
                          d = (+a - +b) / 2
                        } 
                      } else {
                          if(a === '0' && b === 0 && resolver === false || a === '' && b === 0 && resolver === false){                           
                            c = test
                            d = test
                          } else {
                            if(a && b === 0 && team === 'home'){                              
                                c = -test
                                d = test
                              } else if(a && b === 0 && team === 'away') {                                
                                c = test
                                d = -test
                              } else if(a && b && team === "home"){                                
                                c = (+a - +b) / 2;
                                d = -(+a - +b) / 2
                                } else {                                  
                                  c = -(+a - +b) / 2;
                                  d = (+a - +b) / 2
                                } 
                            }
                        }
                      }
                 } catch (error) {
                  console.log(error)
                }
               return [c,d]
              }
                
               //////////////////////////////

               
                let allOdds = el.querySelectorAll(".matchArea");
                allOdds.forEach((element, index)=>{
                  let HdpOdds = [];
                  let OuOdds = [];
                  let fullTime1x2 = [];
                  let correctScores = [];

                  let mainlineBets = [];

                  //This part shoud grab data behing More Bets Button, logic works, tested on static page, but a cant solve how to click all buttons
      /*             
                  let moreBetsButton = element.querySelector(".others");
                  if(moreBetsButton.childElementCount != 0){
                    
                     moreBetsButton.querySelector('.icon-moreExpand').click();
                     
                    const Opts =  element.querySelector(".betTypeTitle");
                    const Odds =  element.querySelector(".betTypeContent")
                    const singleOpt = (Opts === null)? '' : Opts.querySelectorAll(".betCol");
                    const singleOdd = (Odds === null)? '' : Odds.querySelectorAll(".betCol");
                    console.log("WARN0: ", Opts) 
                    console.log("WARN1: ", Odds)
                    console.log("WARN2: ", singleOpt) 
                    console.log("WARN3: ", singleOdd)  
                    if(singleOpt != '' && singleOdd != ''){
                      singleOdd.forEach((el, index)=>{
                        let optsArr = []
                        let oddHomeTeam;
                        let oddAwayTeam;
                        let oddDraw;
                        if(el.childElementCount === 2){
                          oddHomeTeam = (el.childNodes[0].innerText=== "")? '' : el.childNodes[0].innerText;
                          oddAwayTeam = (el.childNodes[1].innerText=== "")? '' : el.childNodes[1].innerText;
                         } else if(el.childElementCount === 1){
                           oddDraw = (el.childNodes[0].innerText=== "")? '' : el.childNodes[0].innerText; 
                          }
                        singleOpt.forEach( (el, index)=>{ 
                          const fTCorrectScoreOpt = el.innerText;  
                          optsArr.push(fTCorrectScoreOpt)                         
                         });

                           if(oddHomeTeam === undefined) {
                            let draw = {
                              type: "FT_CS_d",                      
                              opt: optsArr[index], 
                              odd: oddDraw
                            }
                            correctScores.push(draw)
                           } else {
                            let home = {
                              type: "FT_CS_h",                      
                              opt: optsArr[index], 
                              odd: oddHomeTeam
                            }
                            let away = {
                              type: "FT_CS_a",                      
                              opt: optsArr[index], 
                              odd: oddAwayTeam
                            }
                            correctScores.push(home, away)
                           }
                          }); 
                    }
                   
                  } else {
                    console.log('moreBetsButton.length === 0')
                  } */
                   
                 
                 const allMultiOdds = Array.from(element.querySelectorAll(".multiOdds"));
                  allMultiOdds.forEach( (el, index)=>{
                  //Odds
                    //Full Time Handicap
                    const HdpOddHomeTeam = el.childNodes[1].children[0];
                    const HdpOddAwayTeam = el.childNodes[1].children[1];
                    console.log(HdpOddHomeTeam)                    
                    let resultHdpOddHomeTeam = (HdpOddHomeTeam.children[1] === undefined) ? '' : HdpOddHomeTeam.children[1].innerText;
                    let resultHdpOddAwayTeam = (HdpOddHomeTeam.children[1] === undefined) ? '' : HdpOddAwayTeam.children[1].innerText;
                    //Full Time Over/Under
                    const ouOddHomeTeam = el.childNodes[2].children[0];
                    const ouOddAwayTeam = el.childNodes[2].children[1];
                    let resultOuOddHomeTeam = (ouOddHomeTeam.children[1] === undefined) ? '' : ouOddHomeTeam.children[1].innerText;
                    let resultOuOddAwayTeam = (ouOddAwayTeam.children[1] === undefined) ? '' : ouOddAwayTeam.children[1].innerText;
                    //Full Time 1X2
                    const fullTime1x2HomeTeam = (el.childNodes[3].children[0] === undefined) ? '' : el.childNodes[3].children[0].innerText;
                    const fullTime1x2AwayTeam = (el.childNodes[3].children[1] === undefined) ? '' : el.childNodes[3].children[1].innerText;
                    const fullTime1x2Draw = (el.childNodes[3].children[2] === undefined) ? '' : el.childNodes[3].children[2].innerText;

                    

                  //Opts
                    //Full Time Handicap
                    const HdpOptHomeTeam =  el.childNodes[1].children[0];
                    const HdpOptAwayTeam =  el.childNodes[1].children[1];
                    let optHomeAway = (HdpOptHomeTeam.childElementCount === 0) ? '' : (HdpOptHomeTeam.children[0].innerText === '') ? HdpOptAwayTeam.children[0].innerText : HdpOptHomeTeam.children[0].innerText;                  
                    let homeAway = (HdpOptHomeTeam.childElementCount === 0) ? "home" : (HdpOptHomeTeam.children[0].innerText === '') ? "away" : "home";
                    //Full Time Over/Under
                    const ouOptHomeTeam = el.childNodes[2].children[0];
                    const ouOptAwayTeam = el.childNodes[2].children[1];
                    let optHomeAway2 = (ouOptHomeTeam.childElementCount === 0) ? '' : (ouOptHomeTeam.children[0].innerText === '') ? ouOptAwayTeam.children[0].innerText : ouOptHomeTeam.children[0].innerText;     
                    let homeAway2 = (ouOptHomeTeam.childElementCount === 0) ? "home" : (ouOptHomeTeam.children[0].innerText === '') ? "away" : "home";
                   
                    let hdpOpts =  calc(optHomeAway, homeAway, false);
                    let ouOpts =  calc(optHomeAway2, homeAway2, true);

                    const fullTimeHdpHome = {                       
                        type: "FT_HDP_h",                      
                        opt: hdpOpts[0], 
                        odd: resultHdpOddHomeTeam
                    };

                    const fullTimeHdpAway = {
                        type: "FT_HDP_a",                      
                        opt: hdpOpts[1], 
                        odd: resultHdpOddAwayTeam
                    };

                    let fullTimeOuHome = {
                        type: "FT_OU_o",                      
                        opt: ouOpts[0], 
                        odd: resultOuOddHomeTeam
                    };

                    let fullTimeOuAway = {
                        type: "FT_OU_a",                      
                        opt: ouOpts[1], 
                        odd: resultOuOddAwayTeam
                    };
                    
                    if (index === 0) {
                      if (fullTime1x2HomeTeam.length > 0){
                        let fullTime1x2Home = {
                          type: "FT_1X2_h",                      
                            opt: '-', 
                            odd: fullTime1x2HomeTeam
                        };
    
                        let fullTime1x2Away = {
                          type: "FT_1X2_a",                      
                            opt: '-', 
                            odd: fullTime1x2AwayTeam
                        };
    
                        let fT1x2Draw = {
                          type: "FT_1X2_d",                      
                            opt: '-', 
                            odd: fullTime1x2Draw
                        };
                          fullTime1x2.push(fullTime1x2Home, fullTime1x2Away, fT1x2Draw)
                      }
                    }              
                      HdpOdds.push(fullTimeHdpHome, fullTimeHdpAway)
                      OuOdds.push(fullTimeOuHome, fullTimeOuAway)                   
                  });
                 
                  mainlineBets.push(HdpOdds)
                  mainlineBets.push(OuOdds)                  
                  if(fullTime1x2.length  > 0) {
                    mainlineBets.push(fullTime1x2)
                  }
                  mainlineBets.push(correctScores);
                  mainlineBets.flat();
                  console.log(mainlineBets)
                  league[index] = Object.assign(league[index], {mainlineBets: mainlineBets}); 
                  

                });             
                
               resObj.push(league);
            } 
            catch (error) {
              console.log(error);
            }
          });  
             return resObj.flat();
        }); 
        
        mainObj.push(elements);
       
    } catch (error) {
        log.error("Error in getInfo at app.js: ", error)
    }
    return mainObj
}


getInfo().then(value => {  
  fs.writeFile('odds.txt', JSON.stringify(value, null, 2), (err) => {
    if (err) throw err;
    log.info('The file "odds.txt" has been saved!');
  });
})

