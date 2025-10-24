/*Hooks.once("ready", () => {
  libWrapper.register(
    `cpr-burst-fire`,
    `CPRItem.prototype.loadMixins`,
    function(wrapped) 
    {
      const result = wrapped.call(this);

      if (this.bulletConsumption) {
        const orig = this.bulletConsumption;
        this.bulletConsumption = function(cprRoll) {
          let burstType = "burst fire";
          if (
            cprRoll instanceof CPRRolls.CPRAutofireRoll ||
            cprRoll instanceof CPRRolls.CPRSuppressiveFireRoll
          ) {
            burstType = "autofire";
          }
          const newBulletConsumption = tryGetBurstFire(upgradeType, item);
          if(newBulletConsumption)
            return newBulletConsumption;
          if(burstType == "burst fire")
            return 1;
          return 10;
        };
      }
      return result;
    },
    "WRAPPER"
  );
});*/

Hooks.once("libWrapper.Ready", () => {
  
  libWrapper.register(
    `cpr-burst-fire`,
    `CONFIG.Item.documentClass.prototype.prepareData`,
    
    function(wrapped, ...args) {
      const result = wrapped.apply(this, args);
      
      if (typeof this.bulletConsumption === "function" /*&& !this._bulletConsumptionWrapped*/) {
        
        this.bulletConsumption = function (cprRoll) {
          let bulletCount = 1;
          let upgradeType = "burst fire";
          let rollType = cprRoll.constructor.name;
          if (rollType === "CPRAutofireRoll" || rollType === "CPRSuppressiveFireRoll") {
            bulletCount = 10;
            upgradeType = "autofire";
          }
          const newBulletCount = tryGetBurstFire(upgradeType, this);
          if(newBulletCount > 0)
            bulletCount = newBulletCount;
          return bulletCount;
        };
        //this._bulletConsumptionWrapped = true;
      }
      return result;
    },
    "WRAPPER"
  );

  console.info("🎯 Burst Fire Module Script Loaded (v12, debug mode)");
});

function tryGetBurstFire(upgradeType, item) {
  const upgradeIds = item.system.installedItems?.list || [];
  // console.log("BurstHook: upgradeIds:", upgradeIds);
  // Uncomment above to log the list of installed upgrade IDs

  const upgrades = upgradeIds
    .map(id => item.parent.items.get(id))
    .filter(upg => upg && upg.type === "itemUpgrade");
  // console.log("BurstHook: upgrades found:", upgrades);
  // Uncomment above to log the found upgrades

  // console.log("BurstHook: isStandardAttack:", isStandardAttack);
  // Uncomment above to log if the attack is standard or not

  // === Burst Fire Upgrade Validation ===
  const burstFireUpgrades = upgrades.filter(
    upg => upg.name && upg.name.toLowerCase().includes(upgradeType)
  );
  if (burstFireUpgrades.length > 1) {
    ui.notifications.warn(`Two ${upgradeType} upgrade modules installed—Pick one choom!`);
    console.log(`BurstHook: Multiple ${upgradeType} upgrades detected. Aborting ${upgradeType} logic.`);
    // Uncomment above to log if multiple burst fire upgrades are detected
    return;
  }
  
  const burstFireUpgrade = burstFireUpgrades[0];
  const burstFireFlexible = burstFireUpgrade?.name;
  // console.log("BurstHook: burstFireUpgrade:", burstFireUpgrade);
  // console.log("BurstHook: burstFireFlexible:", burstFireFlexible);
  // Uncomment above to log the burst fire upgrade and its name

  if (!upgrades.length || !burstFireUpgrade || !burstFireFlexible) {
    //console.log(
    //   `BurstHook: Upgrades missing: ${!upgrades.length}\nburstFireUpgrade: ${!burstFireUpgrade}\nburstFireFlexible: ${!burstFireFlexible}`
    //);
    // Uncomment above to log if upgrades are missing
    return;
  }

  const match = burstFireFlexible.match(/\d+/);
  let burstInteger = match ? parseInt(match[0]) : null;
  // console.log("BurstHook: burstInteger extracted:", burstInteger);
  // Uncomment above to log the extracted burst integer

  if (burstInteger < 1) {
    ui.notifications.info(`Burst fire doesn't work that way choom, Burst Fire 2 is minimum upgrade`);
    console.log("BurstHook: Burst integer < 1. Exiting.");
    // Uncomment above to log if the burst integer is less than 1
    return;
  }

  return Math.min(burstInteger, item.system.magazine.value);
}