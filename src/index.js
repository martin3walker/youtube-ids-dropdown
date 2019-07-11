require('dotenv').config();

import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { SelectField, Paragraph } from '@contentful/forma-36-react-components';
import { init } from 'contentful-ui-extensions-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';

class App extends React.Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      value: null,
      videos: [],
      selectedIndex: 0
    };

    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this.props.sdk.window.startAutoResizer();

    console.log(
      this.props.sdk,
      `instance variables: ${this.props.sdk.parameters.instance}`
    );

    // Fetch youtube data
    const getPlaylist = async (nextPage, videos = []) => {
      let url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${
        this.props.sdk.parameters.instance.youtubeApiKey
      }&playlistId=${
        this.props.sdk.parameters.instance.youtubePlaylistId
      }&part=snippet${nextPage ? `&pageToken=${nextPage}` : ''}`;
      let response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      let data = await response.json();
      let { items, nextPageToken } = data;
      videos = [...videos, ...items];

      return nextPageToken ? getPlaylist(nextPageToken, videos) : videos;
    };

    const getVideos = async (idCount = 0, videos = []) => {
      const playlistResponse = await getPlaylist();
      let videoIds = await playlistResponse.map(
        vid => vid.snippet.resourceId.videoId
      );

      let url = `https://www.googleapis.com/youtube/v3/videos?id=${videoIds.slice(
        `${idCount != 0 ? idCount - 1 : idCount}`,
        idCount + 50
      )}&key=${
        this.props.sdk.parameters.instance.youtubeApiKey
      }&part=snippet,contentDetails`;

      let response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      let data = await response.json();
      let { items } = data;
      videos = [...videos, ...items];

      return videoIds.length > idCount + 50
        ? getVideos((idCount += 50), videos)
        : this.setState({ videos: videos });
    };

    getVideos();
  }

  componentDidUpdate() {
    if (this.state.videos.length > 0 && this.state.value === null) {
      let option = document.querySelector('option:checked');
      this.setState({ value: option.value });
    }
  }

  handleChange(event) {
    let target = event.target;
    let option = target.querySelector('option:checked');
    this.setState({ value: option.value });
  }

  render() {
    let videos = this.state.videos;
    this.props.sdk.field.setValue(this.state.value);

    return (
      <React.Fragment>
        {videos.length != 0 ? (
          <SelectField onChange={e => this.handleChange(e)}>
            {videos.map((video, index) => (
              <option
                className="f36-font-size--m"
                value={`${video.id}`}
                key={`vid-${video.id}-${index}`}
              >
                {video.snippet.title}
              </option>
            ))}
          </SelectField>
        ) : (
          <Paragraph className={'f36-font-size--m'}>Fetching Videos</Paragraph>
        )}
      </React.Fragment>
    );
  }
}

init(sdk => {
  ReactDOM.render(<App sdk={sdk} />, document.getElementById('root'));
});

/**
 * By default, iframe of the extension is fully reloaded on every save of a source file.
 * If you want to use HMR (hot module reload) instead of full reload, uncomment the following lines
 */
// if (module.hot) {
//   module.hot.accept();
// }
