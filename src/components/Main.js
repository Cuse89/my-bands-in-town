import React from 'react';
import Header from './Header';
import MyArtists from './MyArtists';
import ArtistPage from './ArtistPage';

class Main extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            artistInfo: {},
            artistEvents: [],
            myArtistsInfo: [],
            // since relying on myArtistsInfo.length in unreliable as indexes could be empty
            infosAmount: 0,
            myArtists: this.getMyArtists(),
            myArtistsPage: true,
            artistInfoPage: false,
        }  

        this.startSearch = this.startSearch.bind(this);
        this.isArtistFollowed = this.isArtistFollowed.bind(this);
        this.updateMyArtists = this.updateMyArtists.bind(this);
        this.myArtistsPage = this.myArtistsPage.bind(this);
        this.artistInfoPage = this.artistInfoPage.bind(this);
        this.toggleMobileSearch = this.toggleMobileSearch.bind(this);
        this.handleShowArtistInfo = this.handleShowArtistInfo.bind(this); 

    }

    

    componentDidMount() {
        this.state.myArtists.forEach((artist) => {
            this.startSearch(artist, true)
        })
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.myArtists != prevState.myArtists) {
            this.updateStorage();
        }
    }
    
    startSearch(artist, getFollowed) {
        const artistUrl = `https://rest.bandsintown.com/artists/${artist}?app_id=c19ad5df9483acf93813b4275bb6d69b`;
        const eventUrl = `https://rest.bandsintown.com/artists/${artist}/events?app_id=c19ad5df9483acf93813b4275bb6d69b&date=upcoming`;
        if (getFollowed) {
            this.getData('myArtist', artistUrl);
        } else {
            this.getData('artist', artistUrl);
            this.getData('event', eventUrl);
        }
    }

    getData(infoType, url) {
        const self = this;
        const Http = new XMLHttpRequest();
        Http.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                self.handleResponses(infoType, Http.responseText);            
            }
        };
        Http.open('GET', url);
        Http.send();
    }

    handleResponses(infoType, response) {
        const info = JSON.parse(response);
        switch(infoType) {
            case 'artist':
                this.setArtistInfo(info, 'artistInfo');
                break;
            case 'event':
                this.setEventInfo(info, 'artistEvents');
                break;
            case 'myArtist':
                this.setMyArtistsInfo(info)
                break;
            default:
                return null
        }        
    }

    setMyArtistsInfo(info) {
        // keep order according to localStorage order (unordered because of async)
        const pos = this.state.myArtists.indexOf(info.name);
        let infoCopy = [...this.state.myArtistsInfo];
        infoCopy[pos] = {
            name: info.name,
            thumb: info.thumb_url,
            eventsCount: info.upcoming_event_count
        };
        this.setState({
            myArtistsInfo: infoCopy,
            infosAmount: this.state.infosAmount +1
        });
    }

    setArtistInfo(info) {
        this.setState({
            artistInfo: {
                name: info.name,
                image: {
                    large: info.image_url,
                    thumb: info.thumb_url
                },
                fbUrl: info.facebook_page_url
            },
            myArtistsPage: false
        });
    }

    setEventInfo(infos) {
        let events = [];
        infos.map((event) => {
            events.push({
                onSaleDateTime: event.on_sale_datetime,
                dateTime: event.datetime,
                description: event.description,
                venue: event.venue,
                offers: event.offers
            })            
        })
        this.setState({
            artistEvents: events
        });
    }

    isArtistFollowed(artist) {
        return this.state.myArtists.includes(artist ? artist : this.state.artistInfo.name);         
    }

    updateMyArtists(artist) {
        if (!this.state.myArtists.includes(artist)) {
            // add artist to array
            this.setState({
                myArtists: [...this.state.myArtists, artist]
            });
            // add artist info to array
            this.startSearch(artist, true);

        } else {
            // remove artist from myArtists array
            let otherArtists = this.state.myArtists.filter((artistEl) => {
                return artistEl != artist;
            });
            // remove artist from myArtistsInfo array
            let otherArtistsinfo = this.state.myArtistsInfo.filter((artistObj) => {
                return artistObj.name != artist
            })
     
            this.setState({
                myArtists: otherArtists,
                myArtistsInfo: otherArtistsinfo,
                infosAmount: this.state.infosAmount -1
            });
        }
    }

    getMyArtists() {
        const artists = window.localStorage.getItem('myArtists');
        return artists ? artists.split('|') : [];
    }

    updateStorage() {
        window.localStorage.setItem('myArtists', this.state.myArtists.join('|'));    
    }

    myArtistsPage() {
        this.setState({
            myArtistsPage: true,
            artistInfoPage: false,
            mobileSearch: false
        });
    }

    artistInfoPage() {
        this.setState({
            artistInfoPage: true,
            myArtistsPage: false,
            mobileSearch: false
        });
    }

    toggleMobileSearch(bool) {
        this.setState({
            mobileSearch: bool
        });
    }

    handleShowArtistInfo(artist) {
        this.startSearch(artist);
        this.artistInfoPage();
    }

    render() {
        return (
            <div className = 'main-container'>
                <Header
                    handleSubmit = {this.handleShowArtistInfo}
                    myArtistsPage = {this.myArtistsPage}
                    toggleMobileSearch = {this.toggleMobileSearch}
                    mobileSearch = {this.state.mobileSearch}
                />
                {
                    this.state.myArtistsPage && this.state.infosAmount == this.state.myArtists.length &&
                    <MyArtists
                        myArtistsInfo = {this.state.myArtistsInfo}
                        handleSubmit = {this.handleShowArtistInfo}
                        isArtistFollowed = {this.isArtistFollowed}
                        updateMyArtists = {this.updateMyArtists}                 
                    />
                }
                {
                    this.state.artistInfoPage &&
                    <ArtistPage
                        artistInfo = {this.state.artistInfo}
                        artistInfoPage = {this.state.artistInfoPage}
                        isArtistFollowed = {this.isArtistFollowed}
                        updateMyArtists = {this.updateMyArtists}
                        artistEvents = {this.state.artistEvents}                    
                    />
                   
                }
            </div>
        )
    }
}

export default Main;