import React from "react";

function TopBar({houseId}){
    return(
        <div style={styles.topBar}>
            <p style={styles.label}>Your Rental</p>
            <h1 style={styles.house}>house{houseId}</h1>
            <p style={styles.address}>Ace apartments. Eldoret</p>


        </div>
    );
}
// its css.
const styles = {
    topBar: {
        backgroundColor: '#1a7a4a',
        color: 'white',
        padding: '32px 40px 35px',
        textAlign: 'center',
    },
    label: {
        fontSize:'11px',
        opacity:'0.8px',
        margin:'0 0 6px',
        letterSpacing:'1px',
        textTransform:'uppercase',
    },
    house: {
        fontSize:'32px',
        fontWeight: '500',
        margin:'0 0 6px',
    },
    address: {
        opacity: '0.75',
        fontSize:'13px',
        margin: '0',
    }


}


export default TopBar;