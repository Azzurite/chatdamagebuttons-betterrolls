/**
 * @author Felix M�ller and hooking#0492
 * @version 0.1
 */

Hooks.on('renderChatMessage', (message, data, html) => {
    let chatCard = html.find('.red-full');
    if (chatCard.length === 0) {
        return;
    } else {
        console.log('in proper chatcard');
    }
    let dmgElements = html.find('.red-left-die').parents('.dice-total'); 
    for (let dmgElement of dmgElements) {
        // creating the buttons and container
        let fullDamageButton = $(`<button data-modifier="1"><i class="fas fa-user-minus" title="Click to apply full damage to selected token(s)."></i></button>`);
        let halfDamageButton = $(`<button data-modifier="0.5"><i class="fas fa-user-shield" title="Click to apply half damage to selected token(s)."></i></button>`);
        let doubleDamageButton = $(`<button data-modifier="2"><i class="fas fa-user-injured" title="Click to apply double damage to selected token(s)."></i></button>`);
        let fullHealingButton = $(`<button data-modifier="-1"><i class="fas fa-user-plus" title="Click to apply full healing to selected token(s)."></i></button>`);

        let btnContainer = $('<span class="dmgBtn-container-br"></span>');

        btnContainer.append(fullDamageButton);
        btnContainer.append(halfDamageButton);
        btnContainer.append(doubleDamageButton);
        btnContainer.append(fullHealingButton);

        // adding the buttons to the the target element
        $(dmgElement).append(btnContainer);

        // adding click events to the buttons, this gets redone since they can break through rerendering of the card
        html.find('.dmgBtn-container-br button').click(async ev => {
            ev.stopPropagation();
            // find out the proper dmg thats supposed to be applied
            let dmg = chatCard.find('.red-left-die').text();
            if (chatCard.find('.red-right-die').length > 0) {
                critDmg = chatCard.find('.red-right-die').text();

                // set position on where to put the dialog
                console.log(ev.originalEvent.screenX);
                let position = { x: ev.originalEvent.screenX, y: ev.originalEvent.screenY };
                dmg = await applyCritDamage(Number(dmg), Number(critDmg), position);
            }
            console.log(dmg);
            // wrapping in html since thats what the applyDamage function expects
            let dmgHtml = $(`<div><h4 class="dice-total">${dmg}</h4></div>`)

            // getting the modifier depending on which of the buttons was pressed
            let modifier = ev.target.dataset.modifier;

            // sometimes the image within the button triggers the event, so we have to make sure to get the proper modifier value
            if (modifier === undefined) {
                modifier = $(ev.target).parent().attr('data-modifier');
            }

            // applying dmg to the targeted token and sending only the span that the button sits in 
            Actor5e.applyDamage(dmgHtml, modifier);
        });

        // logic to only show the buttons when the mouse is within the chatcard
        html.find('.dmgBtn-container-br').hide();
        $(html).hover(evIn => {
            html.find('.dmgBtn-container-br').show();
        }, evOut => {
            html.find('.dmgBtn-container-br').hide();
        });
    }
});

async function applyCritDamage(dmg, critdmg, position) {
    let dialogResult = await new Promise(async (resolve, reject) => {
        let options = {};
        options.left = position.x;
        options.top = position.y;
        options.width = 100;
        
        let d = new Dialog({
            title: "Use crit Damage",
            content: "",
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Yes",
                    callback: () => { resolve(dmg + critdmg); }
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "No",
                    callback: () => { resolve(dmg); }
                }
            },
            default: "two",
            close: () => console.log("This always is logged no matter which option is chosen")
        }, options);
        d.render(true);
    });
    return dialogResult;
}