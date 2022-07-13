import { useEffect, useState } from "react";
import axios from "axios";
import {
  AiOutlineSortAscending,
  AiOutlineSortDescending,
} from "react-icons/ai";
import "./index.css";

const sortingDirectionString = {
  DEFAULT: "DEFAULT",
  ascending: "ASCENDING",
  descending: "DESCENDING",
};
// fetching data from the api
const fetchData = () => {
  return axios
    .get("https://randomuser.me/api/?results=20")
    .then((res) => {
      const { results } = res.data;
      return results;
    })
    .catch((err) => console.error(err));
};
// extracting keys from the location object
const getKeysLocation = (location) => {
  let objectKeys = [];
  Object.keys(location).forEach((locKey) => {
    const value = location[locKey];
    if (typeof value !== "object") {
      objectKeys.push(locKey);
    } else {
      objectKeys = [...objectKeys, ...getKeysLocation(value)];
    }
  });
  return objectKeys;
};

// flattening the location object to get the header
const flattenLocation = (locations) => {
  const data = [];
  for (const { street, coordinates, timezone, ...rest } of locations) {
    data.push({
      ...rest,
      number: street.number,
      name: street.name,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    });
  }
  const locationsHeaders = getKeysLocation(data[0]);
  return { headers: locationsHeaders, data };
};

const filterData = (rows, value) => {
  return rows.filter((row) =>
    JSON.stringify(row).toLowerCase().includes(value)
  );
};

function App() {
  const [people, setPeople] = useState([]);
  const [sortDirection, setSortDirection] = useState("");
  const [flattenedLocations, setFlattenedLocations] = useState({
    headers: [],
    data: [],
  });
  const [inputValue, setInputValue] = useState("");

  // applying the next direction
  const getNextDirection = (currentDirection) => {
    if (
      currentDirection === sortingDirectionString.DEFAULT ||
      currentDirection === sortingDirectionString.descending
    ) {
      return sortingDirectionString.ascending;
    }
    return sortingDirectionString.descending;
  };
  // sorting function
  const sortFormule = (localcolumns, data, sortDirection) => {
    data.sort((a, b) => {
      const valueA = a[localcolumns];
      const valueB = b[localcolumns];
      if (
        sortDirection === sortingDirectionString.DEFAULT ||
        sortDirection === sortingDirectionString.descending
      ) {
        if (valueA < valueB) return -1;
        if (valueA > valueB) return 1;
        return 0;
      } else {
        if (valueA > valueB) return -1;
        if (valueA < valueB) return 1;
        return 0;
      }
    });
  };
  // sorting columns data
  const sortColumns = (localcolumns) => {
    const newFlattenedLocations = {
      headers: flattenedLocations.headers,
      data: [...flattenedLocations.data],
    };
    // setting the current direction for each column
    const currentDirection = sortDirection[localcolumns];
    // sorting columns data
    sortFormule(localcolumns, newFlattenedLocations.data, currentDirection);
    // getting  the next direction
    const nextDirection = getNextDirection(currentDirection);
    // distructring th sort direction
    const newDirection = { ...sortDirection };
    // updating direction for the clicked column
    newDirection[localcolumns] = nextDirection;
    // updating our states
    setSortDirection(newDirection);
    setFlattenedLocations(newFlattenedLocations);
  };

  useEffect(() => {
    fetchData().then((apipeople) => {
      setPeople(apipeople);
      const getFlattenedLocations = flattenLocation(
        apipeople.map(({ location }) => location)
      );
      setFlattenedLocations(getFlattenedLocations);
      const { headers } = getFlattenedLocations;
      const ourSortingDirections = {};
      for (const header of headers) {
        ourSortingDirections[header] = sortingDirectionString.DEFAULT;
      }
      setSortDirection(ourSortingDirections);
    });
    return () => {};
  }, []);

  return (
    <div className="box">
      <h2>
        Search for your coordinates here !  
      </h2>
      <input
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
        }}
      />
      <h4>
        click header column to sort data
      </h4>
      <table>
        <thead>
          <tr>
            {flattenedLocations.headers.map((locHead, idx) => (
              <th
                key={idx}
                onClick={() => {
                  sortColumns(locHead);
                }}
                className="tableHeader"
              >
                <span>{locHead}</span>
                <Icon key={idx} type={sortDirection[locHead]} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filterData(flattenedLocations.data, inputValue).map(
            (singleData, idx) => (
              <tr key={idx}>
                {flattenedLocations.headers.map((locHead, dataidx) => (
                  <td key={dataidx}>{singleData[locHead]}</td>
                ))}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

export const Icon = ({ type }) => {
  if (type === sortingDirectionString.ascending) {
    return <AiOutlineSortAscending />;
  } else if (type === sortingDirectionString.descending) {
    return <AiOutlineSortDescending />;
  } else {
    return;
  }
};

export default App;
