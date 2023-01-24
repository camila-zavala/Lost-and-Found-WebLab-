import React, { useState } from "react";
import { GoogleMap, useJsApiLoader, StreetViewPanorama, Marker } from "@react-google-maps/api";
import { post, get } from "../../../utilities";
import CountDownTimer from "../../modules/Timer";
import "./Maps.css";

const containerStyle = {
  width: "100%",
  height: "650px",
};

const center = {
  lat: -3.745,
  lng: -38.523,
};

//Used to Center Map during "Pick a Location Screen" to mimic typcial map structure;
//ie. North America on the left, Europe/ Africa in middle and Asia on the right
const mapCenter = {
  lat: 20,
  lng: 0,
};

const markerCoordinates = [
  {
    label: "Boston",
    position: { lat: 42.345573, lng: -71.098326 },
    startPositions: [
      { lat: 42.345573, lng: -71.098326 }, // Fenway area
      { lat: 42.35650542248174, lng: -71.0620105380493 }, //Boston Common
      { lat: 42.360126338885586, lng: -71.05587522572742 }, // Quincy Market
    ],
  },
  {
    label: "NewYorkCity",
    position: { lat: 40.75497751666591, lng: -73.98997420018596 },
    startPositions: [{ lat: 40.75497751666591, lng: -73.98997420018596 }],
  },
  {
    label: "LosAngeles",
    position: { lat: 34.01820940007115, lng: -118.2999255824083 },
    startPositions: [{ lat: 34.01820940007115, lng: -118.2999255824083 }],
  },
];

function Maps() {
  // API-HANDLER //
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyDMGy9-oVsU4Ei80p5oaAq1SPGFnPlmPjs",
  });

  // GOOGLE MAP OBJECTS //
  const [map, setMap] = useState(null);
  const [panorama, setPanorama] = useState(null);
  const [markers, setMarkers] = useState({});
  const [insidePano, setInsidePano] = useState(false);

  const getRandomInt = (min, max) => {
    // The maximum is exclusive and the minimum is inclusive
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
  };

  const getStartPosition = (location) => {
    // return random start position of location
    let ix = getRandomInt(0, location.startPositions.length);
    return location.startPositions[ix];
  };

  const CountDownTimer = ({ hoursMinSecs }) => {
    const { hours = 0, minutes = 0, seconds = 60 } = hoursMinSecs;
    const [[hrs, mins, secs], setTime] = React.useState([hours, minutes, seconds]);

    const tick = () => {
      if (hrs === 0 && mins === 0 && secs === 0) reset();
      else if (mins === 0 && secs === 0) {
        setTime([hrs - 1, 59, 59]);
      } else if (secs === 0) {
        setTime([hrs, mins - 1, 59]);
      } else {
        setTime([hrs, mins, secs - 1]);
      }
    };

    const reset = () => setTime([parseInt(hours), parseInt(minutes), parseInt(seconds)]);

    React.useEffect(() => {
      const timerId = setInterval(() => tick(), 1000);
      return () => clearInterval(timerId);
    });

    return (
      <div>
        <p>{`${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs
          .toString()
          .padStart(2, "0")}`}</p>
      </div>
    );
  };
  const hoursMinSecs = { hours: 0, minutes: 5, seconds: 60 };

  return isLoaded ? (
    <>
      <GoogleMap
        className="Map-Container"
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={2}
        onLoad={(map) => {
          setMap(map);
        }}
        onUnmount={(map) => {
          setMap(null);
        }}
        options={{
          disableDefaultUI: true,
          gestureHandling: "none",
          keyboardShortcuts: false,
        }}
      >
        <StreetViewPanorama
          visible={false}
          center={center}
          onUnmount={(panorama) => {
            console.log("onUnmount", panorama);
          }}
          onLoad={(panorama) => {
            panorama.setOptions({
              addressControl: false,
              fullscreenControl: false,
              enableCloseButton: false,
            });
            setPanorama(panorama);
          }}
          onPositionChanged={() => {
            if (insidePano) {
              let newLocation = {
                lat: panorama.location.latLng.lat(),
                lng: panorama.location.latLng.lng(),
              };
              console.log(newLocation.lat);
              console.log(newLocation.lng);
              post("/api/updatePosition", {
                newLocation: newLocation,
              });
              // can remove this post request
              post("/api/calculateDistance", {
                location1: { lat: 42.35650542248174, lng: -71.0620105380493 }, //Boston Common hardcoded
                location2: newLocation,
                test: "test",
              }).then((res) => {
                console.log(res.distance);
              });
            }
          }}
        />
        {markerCoordinates.map((location) => {
          return (
            <Marker
              position={location.position}
              label={location.label}
              key={location.label}
              onLoad={(marker) => {
                markers[location.label] = marker;
              }}
              onClick={(e) => {
                let isBouncing = false;
                const marker = markers[location.label];
                console.log(marker);
                if (isBouncing === false) {
                  marker.setAnimation(google.maps.Animation.BOUNCE);
                  isBouncing = true;
                  window.setTimeout(() => {
                    marker.setAnimation(null);
                    isBouncing = false;
                  }, 5000);
                } else {
                  marker.setAnimation(null);
                  isBouncing = false;
                }
              }}
              onDblClick={(e) => {
                const marker = markers[location.label];
                const startLocation = getStartPosition(location);
                post("/api/spawn", { location: startLocation });
                marker.setVisible(false);
                panorama.setVisible(true);
                panorama.setPosition(startLocation);
                setInsidePano(true);
                // CountDownTimer({hoursMinSecs})
              }}
            />
          );
        })}
      </GoogleMap>
      <div className="Timer-Container">
        <CountDownTimer hoursMinSecs={hoursMinSecs}></CountDownTimer>
      </div>
    </>
  ) : (
    <></>
  );
}

export default Maps;